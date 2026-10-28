#!/usr/bin/env python3
"""Prueba las reglas de las fotografías de producto (migración 12).

Qué se comprueba:
  · Registrar una foto dos veces no crea dos filas.
  · La primera foto asignada queda principal; las siguientes no.
  · `marcar_principal` deja exactamente una principal.
  · `mover_imagen` intercambia posiciones en una sola transacción.
  · Al quitar la principal asciende la siguiente: nunca queda un producto con
    fotos y sin principal.
  · La misma foto no se puede asignar dos veces al mismo producto.
  · Las tablas no aceptan escrituras directas, ni siquiera del administrador.
  · Un usuario autenticado que no es administrador es rechazado.

Todo ocurre dentro de un `savepoint` que se deshace: no quedan datos.

    PYTHONPATH=.venv-libs python3 scripts/probar-fotos.py
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


def sha(n: int) -> str:
    """Huella de 64 caracteres hexadecimales, distinta por número."""
    return f"{n:064x}"


def main() -> int:
    import psycopg

    with psycopg.connect(DSN) as conexion, conexion.cursor() as cur:
        cur.execute("select id from public.perfiles where rol = 'administrador' and activo limit 1")
        fila = cur.fetchone()
        if not fila:
            raise SystemExit("No hay perfil de administrador para probar.")
        admin = fila[0]

        # Todo lo de esta prueba, incluidos la marca y el producto, ocurre dentro
        # del savepoint: al final no queda ni una fila.
        cur.execute("savepoint fotos")

        cur.execute("insert into public.marcas (nombre) values ('Marca prueba fotos') returning id")
        marca = cur.fetchone()[0]
        cur.execute(
            """
            insert into public.productos (codigo_interno, marca_id, modelo, precio_normal, estado)
            values ('PRUEBA-F1', %s, 'Modelo de prueba', 100000, 'publicado') returning id
            """,
            (marca,),
        )
        producto = cur.fetchone()[0]

        cur.execute("set local role authenticated")
        cur.execute(
            "select set_config('request.jwt.claims', %s, true)",
            (json.dumps({"sub": str(admin), "role": "authenticated"}),),
        )

        def rpc(funcion: str, **argumentos):
            lista = ", ".join(f"{clave} => %s" for clave in argumentos)
            cur.execute(f"select * from public.{funcion}({lista})", tuple(argumentos.values()))
            return cur.fetchone()

        def imagenes() -> list[tuple[int, bool]]:
            cur.execute(
                "select orden, principal from public.producto_imagenes"
                " where producto_id = %s order by orden",
                (producto,),
            )
            return cur.fetchall()

        def principal() -> bool:
            return sum(1 for _, p in imagenes() if p) == 1

        # --- registrar ------------------------------------------------------
        id_a, nueva_a = rpc(
            "registrar_foto",
            p_sha256=sha(1), p_ruta="fotos/aaa.webp", p_ruta_min="fotos/aaa-min.webp",
            p_ancho=1600, p_alto=2000, p_bytes=120000,
        )
        comprobar("Registrar una foto nueva devuelve nueva=true", nueva_a is True, str(nueva_a))

        _, nueva_repe = rpc(
            "registrar_foto",
            p_sha256=sha(1), p_ruta="fotos/aaa.webp", p_ruta_min="fotos/aaa-min.webp",
            p_ancho=1600, p_alto=2000, p_bytes=120000,
        )
        comprobar("Registrar la misma foto otra vez devuelve nueva=false", nueva_repe is False, str(nueva_repe))

        cur.execute("select count(*) from public.fotos_sin_asignar where sha256 = %s", (sha(1),))
        comprobar("La bandeja tiene una sola fila para esa foto", cur.fetchone()[0] == 1)

        id_b, _ = rpc("registrar_foto", p_sha256=sha(2), p_ruta="fotos/bbb.webp")
        id_c, _ = rpc("registrar_foto", p_sha256=sha(3), p_ruta="fotos/ccc.webp")

        # --- asignar --------------------------------------------------------
        rpc("asignar_foto", p_foto_id=id_a, p_producto_id=producto)
        rpc("asignar_foto", p_foto_id=id_b, p_producto_id=producto)
        rpc("asignar_foto", p_foto_id=id_c, p_producto_id=producto)
        comprobar(
            "Tres fotos asignadas: principal la primera y orden correlativo",
            imagenes() == [(0, True), (1, False), (2, False)],
            str(imagenes()),
        )
        cur.execute("select count(*) from public.fotos_sin_asignar")
        comprobar("La bandeja queda vacía tras asignar", cur.fetchone()[0] == 0)

        # --- principal ------------------------------------------------------
        cur.execute("select id from public.producto_imagenes where producto_id = %s and orden = 2", (producto,))
        tercera = cur.fetchone()[0]
        rpc("marcar_principal", p_imagen_id=tercera)
        comprobar("Marcar principal deja exactamente una principal", principal(), str(imagenes()))
        cur.execute("select principal from public.producto_imagenes where id = %s", (tercera,))
        comprobar("La principal es la elegida", cur.fetchone()[0] is True)

        # --- orden ----------------------------------------------------------
        rpc("mover_imagen", p_imagen_id=tercera, p_direccion=-1)
        cur.execute(
            "select i.ruta from public.producto_imagenes i where i.producto_id = %s order by i.orden",
            (producto,),
        )
        orden_tras_mover = [r[0] for r in cur.fetchall()]
        comprobar(
            "Subir intercambia con la vecina",
            orden_tras_mover == ["fotos/aaa.webp", "fotos/ccc.webp", "fotos/bbb.webp"],
            str(orden_tras_mover),
        )
        rpc("mover_imagen", p_imagen_id=tercera, p_direccion=-1)
        cur.execute(
            "select ruta from public.producto_imagenes where producto_id = %s order by orden limit 1",
            (producto,),
        )
        comprobar("Subir la primera no rompe el orden", cur.fetchone()[0] == "fotos/ccc.webp")

        # --- eliminar la principal -----------------------------------------
        devuelto = rpc("eliminar_imagen", p_imagen_id=tercera)[0]
        comprobar("Eliminar devuelve las rutas para borrar en Storage",
                  devuelto == {"ruta": "fotos/ccc.webp", "ruta_min": None}, str(devuelto))
        comprobar("Al quitar la principal asciende otra y sigue habiendo una principal",
                  principal() and len(imagenes()) == 2, str(imagenes()))

        # --- duplicado en el mismo producto ---------------------------------
        cur.execute("savepoint duplicado")
        id_d, _ = rpc("registrar_foto", p_sha256=sha(1), p_ruta="fotos/aaa.webp")
        try:
            rpc("asignar_foto", p_foto_id=id_d, p_producto_id=producto)
            comprobar("La misma foto no se puede asignar dos veces al mismo producto", False)
        except psycopg.errors.UniqueViolation:
            comprobar("La misma foto no se puede asignar dos veces al mismo producto", True)
        finally:
            cur.execute("rollback to savepoint duplicado")

        # --- descartar ------------------------------------------------------
        cur.execute("savepoint descartar")
        id_e, _ = rpc("registrar_foto", p_sha256=sha(9), p_ruta="fotos/zzz.webp")
        rpc("descartar_foto", p_foto_id=id_e)
        cur.execute("select count(*) from public.fotos_sin_asignar where id = %s", (id_e,))
        comprobar("Descartar borra la foto de la bandeja", cur.fetchone()[0] == 0)
        cur.execute("rollback to savepoint descartar")

        # --- escrituras directas -------------------------------------------
        directas = (
            ("insert en producto_imagenes",
             "insert into public.producto_imagenes (producto_id, ruta) values (%s, 'x')", (producto,)),
            ("update en producto_imagenes",
             "update public.producto_imagenes set principal = false where producto_id = %s", (producto,)),
            ("delete en producto_imagenes",
             "delete from public.producto_imagenes where producto_id = %s", (producto,)),
            ("insert en fotos_sin_asignar",
             "insert into public.fotos_sin_asignar (sha256, ruta) values (%s, 'x')", (sha(7),)),
        )
        for nombre, sentencia, parametros in directas:
            cur.execute("savepoint directa")
            try:
                cur.execute(sentencia, parametros)
                comprobar(f"Escritura directa rechazada: {nombre}", False)
            except psycopg.errors.InsufficientPrivilege:
                comprobar(f"Escritura directa rechazada: {nombre}", True)
            finally:
                cur.execute("rollback to savepoint directa")

        # --- sin ser administrador -----------------------------------------
        cur.execute("savepoint intruso")
        cur.execute("select set_config('request.jwt.claims', %s, true)", (json.dumps({"role": "authenticated"}),))
        try:
            rpc("registrar_foto", p_sha256=sha(5), p_ruta="fotos/intruso.webp")
            comprobar("Un usuario sin perfil de administrador es rechazado", False)
        except psycopg.errors.InsufficientPrivilege:
            comprobar("Un usuario sin perfil de administrador es rechazado", True)
        finally:
            cur.execute("rollback to savepoint intruso")

        cur.execute("rollback to savepoint fotos")

    # ---------- fase 2: lo que ve `anon` por la API ----------
    estado, cuerpo = api("fotos_sin_asignar?select=id")
    comprobar(
        "`anon` no ve la bandeja de fotos",
        (estado == 200 and cuerpo == []) or estado in (401, 403),
        f"{estado} {cuerpo}",
    )

    estado, _ = api(
        "fotos_sin_asignar",
        "POST",
        {"sha256": sha(8), "ruta": "fotos/anon.webp"},
    )
    comprobar("`anon` no puede escribir en la bandeja", estado in (401, 403), str(estado))

    print()
    if fallos:
        print(f"Fallos: {fallos}. No se entrega.")
        return 1
    print("Todo en verde.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
