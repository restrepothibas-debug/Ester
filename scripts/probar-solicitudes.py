#!/usr/bin/env python3
"""Prueba las reglas de las solicitudes de WhatsApp (puntos 57–61).

Fase 1, con `rollback`: confirmar descontando, confirmar sin descontar, falta de
existencias, cancelación con motivo y devolución de la unidad, y el rechazo a un
usuario sin rol administrador.

Fase 2, con datos temporales confirmados: lo que `anon` puede ver y hacer.

    PYTHONPATH=.venv-libs python3 scripts/probar-solicitudes.py
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
        cur.execute("select id from public.perfiles where rol = 'administrador' and activo limit 1")
        admin = cur.fetchone()[0]

        cur.execute("insert into public.marcas (nombre) values ('Marca prueba solicitudes') returning id")
        marca = cur.fetchone()[0]
        cur.execute(
            """
            insert into public.productos (codigo_interno, marca_id, modelo, precio_normal, estado)
            values ('PRUEBA-SOL', %s, 'Modelo de prueba', 150000, 'publicado') returning id
            """,
            (marca,),
        )
        producto = cur.fetchone()[0]
        cur.execute(
            "insert into public.producto_tallas (producto_id, talla, cantidad) values (%s, '38', 2)",
            (producto,),
        )

        def como_administrador() -> None:
            cur.execute("set local role authenticated")
            cur.execute(
                "select set_config('request.jwt.claims', %s, true)",
                (json.dumps({"sub": str(admin), "role": "authenticated"}),),
            )

        def como_intruso() -> None:
            cur.execute(
                "select set_config('request.jwt.claims', %s, true)",
                (json.dumps({"sub": "00000000-0000-0000-0000-000000000000", "role": "authenticated"}),),
            )

        def solicitud(talla: str = "38") -> str:
            cur.execute(
                "select public.registrar_solicitud(%s, %s, 150000, 'Cliente de prueba', '3000000000')",
                (producto, talla),
            )
            return cur.fetchone()[0]

        def stock() -> int:
            cur.execute(
                "select cantidad from public.producto_tallas where producto_id = %s and talla = '38'",
                (producto,),
            )
            return cur.fetchone()[0]

        def estado(pid: str) -> tuple:
            cur.execute(
                "select estado, inventario_descontado, motivo_cancelacion from public.solicitudes where id = %s",
                (pid,),
            )
            return cur.fetchone()

        def intentar(nombre: str, sql: str, parametros: tuple, debe_rechazar: bool) -> None:
            cur.execute("savepoint caso")
            try:
                cur.execute(sql, parametros)
            except psycopg.Error as error:
                cur.execute("rollback to savepoint caso")
                rechazado, detalle = True, str(error).strip().splitlines()[0]
            else:
                cur.execute("rollback to savepoint caso")
                rechazado, detalle = False, ""
            comprobar(nombre, rechazado == debe_rechazar, detalle)

        cur.execute("savepoint fase1")
        como_administrador()

        # --- confirmar descontando ---
        s1 = solicitud()
        cur.execute("select public.confirmar_solicitud(%s, true)", (s1,))
        comprobar("Confirmar descontando baja el stock de 2 a 1", stock() == 1, f"stock={stock()}")
        comprobar("La solicitud queda confirmada con el descuento marcado", estado(s1)[:2] == ("confirmada", True), str(estado(s1)))
        cur.execute(
            "select tipo, cantidad_anterior, cantidad_nueva from public.movimientos_inventario where producto_id = %s and tipo = 'venta'",
            (producto,),
        )
        movimiento = cur.fetchone()
        comprobar(
            "Deja un movimiento de venta 2 → 1",
            movimiento == ("venta", 2, 1),
            str(movimiento),
        )
        intentar(
            "Una solicitud ya confirmada no se confirma otra vez",
            "select public.confirmar_solicitud(%s, true)",
            (s1,),
            True,
        )

        # --- sin existencias ---
        cur.execute("update public.producto_tallas set cantidad = 0 where producto_id = %s and talla = '38'", (producto,))
        s2 = solicitud()
        intentar(
            "Confirmar descontando sin existencias se rechaza y lo dice",
            "select public.confirmar_solicitud(%s, true)",
            (s2,),
            True,
        )
        comprobar("El rechazo no dejó la solicitud confirmada", estado(s2)[0] == "pendiente", str(estado(s2)))
        cur.execute("select public.confirmar_solicitud(%s, false)", (s2,))
        comprobar(
            "Punto 61 · se puede confirmar sin descontar",
            estado(s2)[:2] == ("confirmada", False) and stock() == 0,
            f"{estado(s2)} stock={stock()}",
        )

        # --- cancelar ---
        s3 = solicitud()
        intentar(
            "Cancelar sin motivo se rechaza",
            "select public.cancelar_solicitud(%s, '   ', false)",
            (s3,),
            True,
        )
        cur.execute("select public.confirmar_solicitud(%s, false)", (s3,))
        cur.execute("select public.cancelar_solicitud(%s, 'Cambió de talla', false)", (s3,))
        comprobar(
            "Cancelar guarda el motivo",
            estado(s3) == ("cancelada", False, "Cambió de talla"),
            str(estado(s3)),
        )

        # --- devolver la unidad al cancelar ---
        cur.execute("update public.producto_tallas set cantidad = 1 where producto_id = %s and talla = '38'", (producto,))
        s4 = solicitud()
        cur.execute("select public.confirmar_solicitud(%s, true)", (s4,))
        comprobar("Antes de devolver hay 0 unidades", stock() == 0, f"stock={stock()}")
        cur.execute("select public.cancelar_solicitud(%s, 'Se arrepintió', true)", (s4,))
        comprobar("Al cancelar se devuelve la unidad (stock 1)", stock() == 1, f"stock={stock()}")
        cur.execute(
            "select count(*) from public.movimientos_inventario where producto_id = %s and tipo = 'devolucion'",
            (producto,),
        )
        comprobar("Deja un movimiento de devolución", cur.fetchone()[0] == 1)
        comprobar("La solicitud cancelada ya no cuenta como descontada", estado(s4) == ("cancelada", False, "Se arrepintió"), str(estado(s4)))

        # --- intruso (la solicitud la registra el administrador) ---
        s5 = solicitud()
        como_intruso()
        intentar(
            "Un usuario sin rol administrador no confirma",
            "select public.confirmar_solicitud(%s, false)",
            (s5,),
            True,
        )
        intentar(
            "Un usuario sin rol administrador no cancela",
            "select public.cancelar_solicitud(%s, 'porque sí', false)",
            (s5,),
            True,
        )
        comprobar(
            "El intruso ni siquiera puede leer la solicitud",
            estado(s5) is None,
            "RLS devuelve vacío para quien no es administrador",
        )
        como_administrador()
        comprobar("La solicitud del intruso sigue pendiente", estado(s5)[0] == "pendiente", str(estado(s5)))

        # --- la tabla ya no acepta escrituras directas ---
        intentar(
            "Un UPDATE directo no puede devolver a pendiente una solicitud confirmada",
            "update public.solicitudes set estado = 'pendiente' where id = %s",
            (s1,),
            True,
        )
        intentar(
            "Marcar `inventario_descontado` a mano está prohibido",
            "update public.solicitudes set inventario_descontado = true where id = %s",
            (s1,),
            True,
        )
        intentar(
            "Borrar una solicitud por la puerta de atrás está prohibido",
            "delete from public.solicitudes where id = %s",
            (s1,),
            True,
        )

        cur.execute("savepoint eliminar")
        try:
            cur.execute("select public.eliminar_solicitud(%s)", (s2,))
            cur.execute("select count(*) from public.solicitudes where id = %s", (s2,))
            eliminada = cur.fetchone()[0] == 0
            detalle = ""
        except psycopg.Error as error:
            detalle = str(error).strip().splitlines()[0]
            eliminada = False
        cur.execute("rollback to savepoint eliminar")
        comprobar("eliminar_solicitud borra la fila (punto 59)", eliminada, detalle)

        cur.execute("rollback to savepoint fase1")
        cur.execute("reset role")
        cur.execute("select set_config('request.jwt.claims', '', true)")

        # --- fase 2: lo que ve `anon` ---
        cur.execute(
            """
            insert into public.solicitudes
              (producto_id, referencia_snapshot, talla, precio_snapshot, cliente_nombre, cliente_telefono)
            values (%s, 'PRUEBA-SOL', '38', 150000, 'Cliente real', '3001112233')
            """,
            (producto,),
        )
        conexion.commit()

        estado_http, cuerpo = api("solicitudes?select=id,cliente_telefono")
        comprobar(
            "`anon` no ve solicitudes (datos personales)",
            not isinstance(cuerpo, list) or len(cuerpo) == 0,
            f"HTTP {estado_http} · {str(cuerpo)[:120]}",
        )

        estado_http, cuerpo = api(
            "solicitudes",
            "POST",
            {
                "producto_id": str(producto),
                "referencia_snapshot": "X",
                "talla": "38",
                "precio_snapshot": 1,
                "cliente_nombre": "Intruso",
                "cliente_telefono": "000",
            },
        )
        comprobar(
            "`anon` no puede crear solicitudes",
            estado_http in (401, 403),
            f"HTTP {estado_http} · {str(cuerpo)[:120]}",
        )

        cur.execute("select count(*) from public.solicitudes")
        comprobar("Queda solo la solicitud de la prueba", cur.fetchone()[0] == 1)

        # --- limpieza ---
        cur.execute("delete from public.solicitudes where producto_id = %s", (producto,))
        cur.execute("delete from public.movimientos_inventario where producto_id = %s", (producto,))
        cur.execute("delete from public.auditoria where entidad = 'solicitudes'")
        cur.execute("delete from public.producto_tallas where producto_id = %s", (producto,))
        cur.execute("delete from public.productos where id = %s", (producto,))
        cur.execute("delete from public.marcas where id = %s", (marca,))
        conexion.commit()
        cur.execute("select count(*) from public.solicitudes")
        print(f"\nlimpieza · solicitudes restantes: {cur.fetchone()[0]}")

    print(f"{fallos} fallos")
    sys.exit(1 if fallos else 0)


if __name__ == "__main__":
    main()
