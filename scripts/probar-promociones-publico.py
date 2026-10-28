#!/usr/bin/env python3
"""Comprueba en la API real lo que ve el público y lo que puede hacer `anon`.

Evidencia del Listón E: E1 (precio promocional en el catálogo), E2 (al vencer
vuelve el precio normal) y E10 (`anon` no crea ni modifica promociones).

Crea datos temporales y los borra al final, incluso si algo falla.

    PYTHONPATH=.venv-libs python3 scripts/probar-promociones-publico.py
"""
from __future__ import annotations

import json
import pathlib
import sys
import urllib.error
import urllib.request

RAIZ = pathlib.Path(__file__).resolve().parent.parent


def leer_env() -> dict[str, str]:
    valores: dict[str, str] = {}
    for linea in (RAIZ / ".env.local").read_text(encoding="utf-8").splitlines():
        if "=" in linea and not linea.strip().startswith("#"):
            clave, valor = linea.split("=", 1)
            valores[clave.strip()] = valor.strip()
    return valores


ENV = leer_env()
BASE = ENV["VITE_SUPABASE_URL"].rstrip("/")
ANON = ENV["VITE_SUPABASE_ANON_KEY"]
DSN = ENV["SUPABASE_DB_URL"]

fallos = 0


def comprobar(nombre: str, correcto: bool, detalle: str = "") -> None:
    global fallos
    if not correcto:
        fallos += 1
    print(f"{'✔' if correcto else '✘'} · {nombre}" + (f"\n    {detalle}" if detalle else ""))


def api(ruta: str, metodo: str = "GET", cuerpo: dict | None = None, clave: str = ANON):
    datos = json.dumps(cuerpo).encode() if cuerpo is not None else None
    peticion = urllib.request.Request(
        f"{BASE}/rest/v1/{ruta}",
        data=datos,
        method=metodo,
        headers={
            "apikey": clave,
            "Authorization": f"Bearer {clave}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        },
    )
    try:
        with urllib.request.urlopen(peticion) as respuesta:
            texto = respuesta.read().decode()
            return respuesta.status, (json.loads(texto) if texto else None)
    except urllib.error.HTTPError as error:
        return error.code, error.read().decode()


def main() -> None:
    import psycopg

    producto_id = None
    marca_id = None

    with psycopg.connect(DSN) as conexion:
        with conexion.cursor() as cur:
            # Restos de una ejecución interrumpida: solo borra lo que crea este script.
            cur.execute("delete from public.productos where codigo_interno = 'TEMP-API'")
            cur.execute("delete from public.marcas where nombre = 'Marca temporal API'")
            conexion.commit()
            try:
                cur.execute(
                    "insert into public.marcas (nombre) values ('Marca temporal API') returning id"
                )
                marca_id = cur.fetchone()[0]
                cur.execute(
                    """
                    insert into public.productos
                      (codigo_interno, marca_id, modelo, precio_normal, estado)
                    values ('TEMP-API', %s, 'Modelo temporal', 200000, 'publicado')
                    returning id
                    """,
                    (marca_id,),
                )
                producto_id = cur.fetchone()[0]
                cur.execute(
                    """
                    insert into public.promociones (producto_id, precio_promocional, tipo)
                    values (%s, 150000, 'manual') returning id
                    """,
                    (producto_id,),
                )
                promo_id = cur.fetchone()[0]
                conexion.commit()

                print("Con una promoción manual vigente de 150.000 sobre 200.000:")

                estado, cuerpo = api("promociones?select=producto_id,precio_promocional,activa")
                comprobar(
                    "E1 · `anon` ve la promoción vigente",
                    estado == 200 and isinstance(cuerpo, list) and len(cuerpo) == 1,
                    f"HTTP {estado} · {cuerpo}",
                )

                estado, cuerpo = api(
                    "productos?select=modelo,precio_normal,promociones(precio_promocional)"
                    f"&id=eq.{producto_id}"
                )
                fila = cuerpo[0] if estado == 200 and cuerpo else {}
                promo = (fila.get("promociones") or [{}])[0]
                comprobar(
                    "E1 · el catálogo recibe ambos precios para mostrar la rebaja",
                    fila.get("precio_normal") == 200000 and promo.get("precio_promocional") == 150000,
                    f"HTTP {estado} · {fila}",
                )

                estado, cuerpo = api(
                    "promociones",
                    "POST",
                    {"producto_id": str(producto_id), "precio_promocional": 100000, "tipo": "manual"},
                )
                comprobar(
                    "E10 · `anon` no puede crear promociones",
                    estado in (401, 403),
                    f"HTTP {estado} · {str(cuerpo)[:120]}",
                )

                estado, cuerpo = api(
                    f"promociones?id=eq.{promo_id}", "PATCH", {"precio_promocional": 1}
                )
                comprobar(
                    "E10 · `anon` no puede modificar promociones",
                    not isinstance(cuerpo, list) or len(cuerpo) == 0,
                    f"HTTP {estado} · {str(cuerpo)[:120]}",
                )

                estado, cuerpo = api(f"promociones?id=eq.{promo_id}", "DELETE")
                comprobar(
                    "E10 · `anon` no puede borrar promociones",
                    not isinstance(cuerpo, list) or len(cuerpo) == 0,
                    f"HTTP {estado} · {str(cuerpo)[:120]}",
                )

                cur.execute("select precio_promocional from public.promociones where id = %s", (promo_id,))
                comprobar(
                    "E10 · la promoción sigue intacta tras los intentos",
                    cur.fetchone()[0] == 150000,
                )

                print("\nAl vencer la promoción (fecha final en el pasado):")
                cur.execute(
                    """
                    update public.promociones
                       set inicia_en = now() - interval '2 days',
                           termina_en = now() - interval '1 day'
                     where id = %s
                    """,
                    (promo_id,),
                )
                conexion.commit()

                estado, cuerpo = api("promociones?select=id")
                comprobar(
                    "E2 · `anon` deja de ver la promoción vencida",
                    estado == 200 and cuerpo == [],
                    f"HTTP {estado} · {cuerpo}",
                )

                cur.execute("select count(*) from public.promociones where id = %s", (promo_id,))
                comprobar("E4 · la promoción vencida no se borró", cur.fetchone()[0] == 1)

                estado, cuerpo = api(
                    f"productos?select=precio_normal,promociones(precio_promocional)&id=eq.{producto_id}"
                )
                fila = cuerpo[0] if estado == 200 and cuerpo else {}
                comprobar(
                    "E2 · el catálogo vuelve al precio normal",
                    fila.get("precio_normal") == 200000 and fila.get("promociones") == [],
                    f"HTTP {estado} · {fila}",
                )
            finally:
                conexion.rollback()
                if producto_id:
                    cur.execute("delete from public.productos where id = %s", (producto_id,))
                if marca_id:
                    cur.execute("delete from public.marcas where id = %s", (marca_id,))
                conexion.commit()
                cur.execute("select count(*) from public.productos where codigo_interno = 'TEMP-API'")
                print(f"\nlimpieza · productos temporales restantes: {cur.fetchone()[0]}")

    print(f"{fallos} fallos")
    sys.exit(1 if fallos else 0)


if __name__ == "__main__":
    main()
