#!/usr/bin/env python3
"""Prueba el orden y los permisos de destacados y oferta de la semana.

Dos fases:
  1. En transacciones con `rollback`: orden único, mover arriba/abajo, un
     no-administrador rechazado, duplicado rechazado.
  2. Con datos temporales confirmados: lo que ve y lo que puede hacer `anon`
     por la API. Al final se borra todo.

    PYTHONPATH=.venv-libs python3 scripts/probar-destacados.py
"""
from __future__ import annotations

import json
import pathlib
import sys
import urllib.error
import urllib.request

RAIZ = pathlib.Path(__file__).resolve().parent.parent
fallos = 0


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


def comprobar(nombre: str, correcto: bool, detalle: str = "") -> None:
    global fallos
    if not correcto:
        fallos += 1
    print(f"{'✔' if correcto else '✘'} · {nombre}" + (f"\n    {detalle}" if detalle else ""))


def api(ruta: str, metodo: str = "GET", cuerpo: dict | None = None):
    datos = json.dumps(cuerpo).encode() if cuerpo is not None else None
    peticion = urllib.request.Request(
        f"{BASE}/rest/v1/{ruta}",
        data=datos,
        method=metodo,
        headers={
            "apikey": ANON,
            "Authorization": f"Bearer {ANON}",
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

    with psycopg.connect(DSN) as conexion, conexion.cursor() as cur:
        # ---------- fase 1: reglas, con rollback ----------
        cur.execute("select id from public.perfiles where rol = 'administrador' and activo limit 1")
        fila = cur.fetchone()
        if not fila:
            raise SystemExit("No hay perfil de administrador para probar.")
        admin = fila[0]

        cur.execute("insert into public.marcas (nombre) values ('Marca prueba destacados') returning id")
        marca = cur.fetchone()[0]
        productos = {}
        for codigo, estado in (
            ("PRUEBA-D1", "publicado"),
            ("PRUEBA-D2", "publicado"),
            ("PRUEBA-D3", "publicado"),
            ("PRUEBA-D4", "borrador"),
        ):
            cur.execute(
                """
                insert into public.productos (codigo_interno, marca_id, modelo, precio_normal, estado)
                values (%s, %s, 'Modelo de prueba', 100000, %s) returning id
                """,
                (codigo, marca, estado),
            )
            productos[codigo] = cur.fetchone()[0]

        cur.execute("savepoint fase1")
        # Como administrador de verdad: el rol y el claim que evalúa es_admin().
        cur.execute("set local role authenticated")
        cur.execute(
            "select set_config('request.jwt.claims', %s, true)",
            (json.dumps({"sub": str(admin), "role": "authenticated"}),),
        )

        def posiciones() -> list[tuple[int, str]]:
            cur.execute(
                """
                select s.orden, p.codigo_interno
                from public.selecciones s
                join public.productos p on p.id = s.producto_id
                where s.tipo = 'destacado' and s.activo
                order by s.orden
                """
            )
            return cur.fetchall()

        def rpc(funcion: str, argumentos: dict) -> None:
            lista = ", ".join(f"{clave} => %s" for clave in argumentos)
            cur.execute(f"select public.{funcion}({lista})", tuple(argumentos.values()))

        rpc("agregar_seleccion", {"p_producto_id": productos["PRUEBA-D1"], "p_tipo": "destacado"})
        rpc("agregar_seleccion", {"p_producto_id": productos["PRUEBA-D2"], "p_tipo": "destacado"})
        rpc("agregar_seleccion", {"p_producto_id": productos["PRUEBA-D3"], "p_tipo": "destacado"})
        comprobar(
            "Añadir asigna posiciones 1, 2, 3",
            posiciones() == [(1, "PRUEBA-D1"), (2, "PRUEBA-D2"), (3, "PRUEBA-D3")],
            str(posiciones()),
        )

        cur.execute("select id from public.selecciones where producto_id = %s and tipo = 'destacado'", (productos["PRUEBA-D3"],))
        tercera = cur.fetchone()[0]
        rpc("mover_seleccion", {"p_tipo": "destacado", "p_id": tercera, "p_direccion": -1})
        comprobar(
            "Mover arriba intercambia con la vecina",
            posiciones() == [(1, "PRUEBA-D1"), (2, "PRUEBA-D3"), (3, "PRUEBA-D2")],
            str(posiciones()),
        )

        cur.execute("select id from public.selecciones where producto_id = %s and tipo = 'destacado'", (productos["PRUEBA-D1"],))
        primera = cur.fetchone()[0]
        rpc("mover_seleccion", {"p_tipo": "destacado", "p_id": primera, "p_direccion": -1})
        comprobar(
            "Mover la primera hacia arriba no hace nada",
            posiciones() == [(1, "PRUEBA-D1"), (2, "PRUEBA-D3"), (3, "PRUEBA-D2")],
            str(posiciones()),
        )

        cur.execute("savepoint duplicado")
        try:
            rpc("agregar_seleccion", {"p_producto_id": productos["PRUEBA-D1"], "p_tipo": "destacado"})
            duplicado_rechazado = False
            detalle = ""
        except psycopg.Error as error:
            cur.execute("rollback to savepoint duplicado")
            duplicado_rechazado = True
            detalle = str(error).strip().splitlines()[0]
        comprobar("El mismo producto no entra dos veces en el mismo bloque", duplicado_rechazado, detalle)

        cur.execute("savepoint otro_tipo")
        try:
            rpc("agregar_seleccion", {"p_producto_id": productos["PRUEBA-D1"], "p_tipo": "oferta_semana"})
            otro_tipo_ok = True
            detalle = ""
        except psycopg.Error as error:
            cur.execute("rollback to savepoint otro_tipo")
            otro_tipo_ok = False
            detalle = str(error).strip().splitlines()[0]
        comprobar("El mismo producto sí puede estar en los dos bloques (D-36)", otro_tipo_ok, detalle)

        # Un usuario autenticado que no es administrador.
        cur.execute(
            "select set_config('request.jwt.claims', %s, true)",
            (json.dumps({"sub": "00000000-0000-0000-0000-000000000000", "role": "authenticated"}),),
        )
        cur.execute("savepoint intruso")
        try:
            cur.execute(
                "select public.agregar_seleccion(%s, 'destacado')",
                (productos["PRUEBA-D4"],),
            )
            intruso_rechazado = False
            detalle = ""
        except psycopg.Error as error:
            cur.execute("rollback to savepoint intruso")
            intruso_rechazado = True
            detalle = str(error).strip().splitlines()[0]
        comprobar("Un usuario sin rol administrador no puede añadir", intruso_rechazado, detalle)

        cur.execute("select count(*) from public.selecciones where producto_id = %s", (productos["PRUEBA-D4"],))
        comprobar("El intento del intruso no dejó fila", cur.fetchone()[0] == 0)

        cur.execute("rollback to savepoint fase1")

        # ---------- fase 2: lo que ve y hace `anon` ----------
        cur.execute("reset role")
        cur.execute(
            "insert into public.selecciones (producto_id, tipo, orden, activo) values (%s,'destacado',1,true)",
            (productos["PRUEBA-D1"],),
        )
        cur.execute(
            "insert into public.selecciones (producto_id, tipo, orden, activo) values (%s,'destacado',2,true)",
            (productos["PRUEBA-D4"],),
        )
        conexion.commit()

        estado, cuerpo = api("selecciones?select=orden,productos(codigo_interno)&tipo=eq.destacado&order=orden")
        visibles = [f["productos"]["codigo_interno"] for f in cuerpo] if estado == 200 and cuerpo else []
        comprobar(
            "`anon` solo ve el destacado publicado, no el borrador",
            visibles == ["PRUEBA-D1"],
            f"HTTP {estado} · {cuerpo}",
        )

        estado, cuerpo = api(
            "selecciones",
            "POST",
            {"producto_id": str(productos["PRUEBA-D2"]), "tipo": "destacado", "orden": 9},
        )
        comprobar("`anon` no puede crear selecciones", estado in (401, 403), f"HTTP {estado} · {str(cuerpo)[:120]}")

        estado, cuerpo = api("selecciones?tipo=eq.destacado", "PATCH", {"orden": 7})
        comprobar(
            "`anon` no puede reordenar",
            not isinstance(cuerpo, list) or len(cuerpo) == 0,
            f"HTTP {estado} · {str(cuerpo)[:120]}",
        )

        estado, cuerpo = api("selecciones?tipo=eq.destacado", "DELETE")
        comprobar(
            "`anon` no puede borrar selecciones",
            not isinstance(cuerpo, list) or len(cuerpo) == 0,
            f"HTTP {estado} · {str(cuerpo)[:120]}",
        )

        cur.execute("select count(*) from public.selecciones")
        comprobar("Las filas siguen intactas tras los intentos", cur.fetchone()[0] == 2)

        # ---------- limpieza ----------
        cur.execute("delete from public.selecciones where producto_id in (select id from public.productos where codigo_interno like 'PRUEBA-D%')")
        cur.execute("delete from public.auditoria where entidad = 'selecciones'")
        cur.execute("delete from public.productos where codigo_interno like 'PRUEBA-D%'")
        cur.execute("delete from public.marcas where nombre = 'Marca prueba destacados'")
        conexion.commit()
        cur.execute("select count(*) from public.selecciones")
        print(f"\nlimpieza · selecciones restantes: {cur.fetchone()[0]}")

    print(f"{fallos} fallos")
    sys.exit(1 if fallos else 0)


if __name__ == "__main__":
    main()
