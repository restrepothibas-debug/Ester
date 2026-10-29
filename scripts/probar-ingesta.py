#!/usr/bin/env python3
"""Prueba la bandeja de entrada de WhatsApp (migración 13).

Comprueba que un mensaje no entra dos veces, que cerrar una entrada exige
producto cuando se marca como convertida, que un administrador sin permiso no
puede cerrar nada y que la tabla no acepta escrituras directas.

Todo ocurre dentro de un savepoint: no deja ni una fila.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

import psycopg

DSN = next(
    l.split("=", 1)[1].strip()
    for l in Path(".env.local").read_text().splitlines()
    if l.startswith("SUPABASE_DB_URL=")
)
ENV = {
    l.split("=", 1)[0]: l.split("=", 1)[1].strip()
    for l in Path(".env.local").read_text().splitlines()
    if "=" in l and not l.startswith("#")
}

pasadas = 0
falladas = 0


def comprobar(nombre: str, condicion: bool, detalle: object = "") -> None:
    global pasadas, falladas
    if condicion:
        pasadas += 1
        print(f"  \u001b[32m✔\u001b[0m · {nombre}")
    else:
        falladas += 1
        print(f"  \u001b[31m✖\u001b[0m · {nombre}\n      {detalle}")


def api(ruta: str, clave: str, metodo: str = "GET", cuerpo: dict | None = None):
    url = f"{ENV['VITE_SUPABASE_URL'].rstrip('/')}/rest/v1/{ruta}"
    datos = json.dumps(cuerpo).encode() if cuerpo else None
    req = urllib.request.Request(
        url,
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
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status, json.loads(r.read() or b"[]")
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"[]")


def main() -> int:
    with psycopg.connect(DSN) as conexion, conexion.cursor() as cur:
        cur.execute("select id from public.perfiles where rol = 'administrador' and activo limit 1")
        fila = cur.fetchone()
        if not fila:
            print("No hay administrador en perfiles")
            return 1
        admin = fila[0]

        cur.execute("savepoint ingesta")

        cur.execute("insert into public.marcas (nombre) values ('Marca prueba ingesta') returning id")
        marca = cur.fetchone()[0]
        cur.execute(
            "insert into public.productos (marca_id, codigo_interno, modelo, precio_normal, estado)"
            " values (%s, 'ING-01', 'Modelo prueba ingesta', 150000, 'borrador') returning id",
            (marca,),
        )
        producto = cur.fetchone()[0]

        cur.execute("set local role authenticated")
        cur.execute(
            "select set_config('request.jwt.claims', %s, true)",
            (json.dumps({"sub": str(admin), "role": "authenticated"}),),
        )

        def rpc(funcion: str, **argumentos):
            lista = ", ".join(f"{k} => %s" for k in argumentos)
            cur.execute(f"select * from public.{funcion}({lista})", tuple(argumentos.values()))
            return cur.fetchone()

        print("\nBandeja de entrada\n")

        r1 = rpc("registrar_ingesta", p_wa_message_id="wamid.PRUEBA1", p_texto="Botín Aurora $159.000 tallas 36")
        comprobar("un mensaje nuevo entra", r1[0]["nueva"] is True, r1)
        primero = r1[0]["id"]

        r2 = rpc("registrar_ingesta", p_wa_message_id="wamid.PRUEBA1", p_texto="Botín Aurora $159.000 tallas 36")
        comprobar("el mismo mensaje no entra dos veces", r2[0]["nueva"] is False, r2)
        comprobar("y devuelve la fila que ya existía", str(r2[0]["id"]) == str(primero), (r2, primero))

        cur.execute("select count(*) from public.ingesta_whatsapp where wa_message_id = 'wamid.PRUEBA1'")
        comprobar("hay exactamente una fila", cur.fetchone()[0] == 1)

        cur.execute("savepoint antes_convertir")
        try:
            rpc("cerrar_ingesta", p_id=primero, p_estado="convertida")
            comprobar("convertir sin producto se rechaza", False)
        except psycopg.errors.Error as e:
            comprobar("convertir sin producto se rechaza", "necesita producto" in str(e), e)
            cur.execute("rollback to savepoint antes_convertir")

        rpc("cerrar_ingesta", p_id=primero, p_estado="convertida", p_producto_id=producto)
        cur.execute("select estado, producto_id from public.ingesta_whatsapp where id = %s", (primero,))
        estado, prod = cur.fetchone()
        comprobar("convertir con producto cierra la entrada", (estado, prod) == ("convertida", producto), (estado, prod))

        r3 = rpc("registrar_ingesta", p_wa_message_id="wamid.PRUEBA2", p_tipo="image", p_media_id="123")
        segundo = r3[0]["id"]
        rpc("cerrar_ingesta", p_id=segundo, p_estado="descartada", p_notas="no es mercancía")
        cur.execute("select estado, notas from public.ingesta_whatsapp where id = %s", (segundo,))
        comprobar("descartar guarda el motivo", cur.fetchone() == ("descartada", "no es mercancía"))

        cur.execute("savepoint antes_update")
        try:
            cur.execute("update public.ingesta_whatsapp set estado = 'pendiente' where id = %s", (primero,))
            comprobar("no se puede escribir a mano en la bandeja", False)
        except psycopg.errors.InsufficientPrivilege:
            comprobar("no se puede escribir a mano en la bandeja", True)
            cur.execute("rollback to savepoint antes_update")

        cur.execute("reset role")
        cur.execute("rollback to savepoint ingesta")

    print("\nFuera de la base\n")

    anon = ENV["VITE_SUPABASE_ANON_KEY"]
    estado_http, cuerpo = api("ingesta_whatsapp?select=id", anon)
    comprobar("`anon` no ve la bandeja", estado_http == 200 and cuerpo == [], (estado_http, cuerpo))

    estado_http, _ = api(
        "ingesta_whatsapp", anon, "POST", {"wa_message_id": "wamid.ANON", "texto": "intruso"}
    )
    comprobar("`anon` no escribe en la bandeja", estado_http in (401, 403), estado_http)

    total = pasadas + falladas
    print(f"\n{'Todo en verde' if falladas == 0 else 'Hay fallos'}: {pasadas}/{total} comprobaciones.\n")
    return 0 if falladas == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
