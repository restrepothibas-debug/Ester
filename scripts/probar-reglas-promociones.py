#!/usr/bin/env python3
"""Prueba las reglas de promociones contra la base real y no deja rastro.

Cada caso se ejecuta dentro de un punto de guardado y se deshace al final, así
que la tabla queda igual que antes. Es la evidencia del Listón E (E5, E6, E7) y
de las decisiones D-31 y D-32.

    PYTHONPATH=.venv-libs python3 scripts/probar-reglas-promociones.py
"""
from __future__ import annotations

import os
import pathlib
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent


def leer_dsn() -> str:
    dsn = os.environ.get("SUPABASE_DB_URL", "").strip()
    if dsn:
        return dsn
    env = RAIZ / ".env.local"
    for linea in env.read_text(encoding="utf-8").splitlines():
        if linea.startswith("SUPABASE_DB_URL="):
            return linea.split("=", 1)[1].strip()
    raise SystemExit("Falta SUPABASE_DB_URL")


def main() -> None:
    import psycopg

    casos: list[tuple[str, str, bool, str]] = []  # nombre, esperado, obtenido, detalle
    fallos = 0

    with psycopg.connect(leer_dsn()) as conexion:
        with conexion.cursor() as cur:
            cur.execute(
                "insert into public.marcas (nombre) values ('Marca de prueba promociones') returning id"
            )
            marca = cur.fetchone()[0]
            cur.execute(
                """
                insert into public.productos (codigo_interno, marca_id, modelo, precio_normal)
                values ('PRUEBA-PROMO', %s, 'Modelo de prueba', 100000)
                returning id
                """,
                (marca,),
            )
            producto = cur.fetchone()[0]
            cur.execute(
                """
                insert into public.promociones (producto_id, precio_promocional, tipo)
                values (%s, 80000, 'manual') returning id
                """,
                (producto,),
            )
            promo = cur.fetchone()[0]

            def ejecutar(nombre: str, debe_rechazar: bool, sql: str, parametros: tuple) -> None:
                nonlocal fallos
                cur.execute("savepoint caso")
                try:
                    cur.execute(sql, parametros)
                except psycopg.Error as error:
                    cur.execute("rollback to savepoint caso")
                    rechazado = True
                    detalle = str(error).strip().splitlines()[0]
                else:
                    cur.execute("rollback to savepoint caso")
                    rechazado = False
                    detalle = ""
                correcto = rechazado == debe_rechazar
                if not correcto:
                    fallos += 1
                if debe_rechazar:
                    estado = "✔ rechazado" if rechazado else "✘ ACEPTADO"
                else:
                    estado = "✔ permitido" if not rechazado else "✘ bloqueado"
                print(f"{estado} · {nombre}" + (f"\n    {detalle}" if detalle else ""))
                casos.append((nombre, "rechazo" if debe_rechazar else "aceptación", correcto, detalle))

            print("Con una promoción manual de 80.000 sobre un producto de 100.000:")
            ejecutar(
                "D-31 · segunda promoción vigente del mismo producto",
                True,
                "insert into public.promociones (producto_id, precio_promocional, tipo) values (%s, 70000, 'manual')",
                (producto,),
            )
            ejecutar(
                "D-32 · precio promocional igual al normal",
                True,
                "update public.promociones set precio_promocional = 100000 where id = %s",
                (promo,),
            )
            ejecutar(
                "D-32 · precio promocional mayor que el normal",
                True,
                "update public.promociones set precio_promocional = 150000 where id = %s",
                (promo,),
            )
            ejecutar(
                "E5 · programada sin fecha final",
                True,
                "insert into public.promociones (producto_id, precio_promocional, tipo) values (%s, 90000, 'programada')",
                (producto,),
            )
            ejecutar(
                "E6 · fecha final anterior al inicio",
                True,
                """
                insert into public.promociones
                  (producto_id, precio_promocional, tipo, inicia_en, termina_en)
                values (%s, 90000, 'programada', now(), now() - interval '1 day')
                """,
                (producto,),
            )
            ejecutar(
                "E7 · precio promocional negativo",
                True,
                "update public.promociones set precio_promocional = -1 where id = %s",
                (promo,),
            )
            ejecutar(
                "D-32 · bajar el precio normal por debajo de la promoción",
                True,
                "update public.productos set precio_normal = 70000 where id = %s",
                (producto,),
            )
            ejecutar(
                "D-32 · subir el precio normal por encima de la promoción",
                False,
                "update public.productos set precio_normal = 120000 where id = %s",
                (producto,),
            )
            ejecutar(
                "D-31 · programar a futuro mientras una promoción abierta sigue vigente",
                True,
                """
                insert into public.promociones
                  (producto_id, precio_promocional, tipo, inicia_en, termina_en)
                values (%s, 90000, 'programada', now() + interval '10 days', now() + interval '20 days')
                """,
                (producto,),
            )

            print("\nCon fecha de fin en la promoción vigente (termina en 5 días):")
            cur.execute(
                "update public.promociones set termina_en = now() + interval '5 days' where id = %s",
                (promo,),
            )
            ejecutar(
                "E2 · programada que empieza después del fin de la anterior",
                False,
                """
                insert into public.promociones
                  (producto_id, precio_promocional, tipo, inicia_en, termina_en)
                values (%s, 90000, 'programada', now() + interval '10 days', now() + interval '20 days')
                """,
                (producto,),
            )
            ejecutar(
                "D-31 · programada que se solapa con la vigente",
                True,
                """
                insert into public.promociones
                  (producto_id, precio_promocional, tipo, inicia_en, termina_en)
                values (%s, 90000, 'programada', now() + interval '1 day', now() + interval '3 days')
                """,
                (producto,),
            )

            print("\nTras finalizar la promoción vigente (solo se apaga `activa`):")
            cur.execute("update public.promociones set activa = false where id = %s", (promo,))
            ejecutar(
                "El producto queda libre para otra promoción",
                False,
                "insert into public.promociones (producto_id, precio_promocional, tipo) values (%s, 85000, 'manual')",
                (producto,),
            )

            # --- Huecos que encontró la auditoría del 28/10 (migración 7) -----
            print("\nHuecos cerrados después de la auditoría:")

            def nuevo_producto(codigo: str, precio: int):
                cur.execute(
                    """
                    insert into public.productos (codigo_interno, marca_id, modelo, precio_normal)
                    values (%s, %s, 'Modelo de prueba', %s) returning id
                    """,
                    (codigo, marca, precio),
                )
                return cur.fetchone()[0]

            futuro = nuevo_producto("PRUEBA-FUTURO", 100000)
            cur.execute(
                """
                insert into public.promociones
                  (producto_id, precio_promocional, tipo, inicia_en, termina_en)
                values (%s, 90000, 'programada', now() + interval '10 days', now() + interval '20 days')
                """,
                (futuro,),
            )
            ejecutar(
                "D-32 · bajar el precio normal durante una promoción programada",
                True,
                "update public.productos set precio_normal = 70000 where id = %s",
                (futuro,),
            )
            ejecutar(
                "E7 · precio promocional de cero",
                True,
                "insert into public.promociones (producto_id, precio_promocional, tipo) values (%s, 0, 'manual')",
                (futuro,),
            )

            viejo = nuevo_producto("PRUEBA-REACTIVAR", 100000)
            cur.execute(
                "insert into public.promociones (producto_id, precio_promocional, tipo) values (%s, 95000, 'manual') returning id",
                (viejo,),
            )
            apagada = cur.fetchone()[0]
            cur.execute("update public.promociones set activa = false where id = %s", (apagada,))
            cur.execute("update public.productos set precio_normal = 80000 where id = %s", (viejo,))
            ejecutar(
                "D-32 · reactivar una promoción más cara que el precio de lista actual",
                True,
                "update public.promociones set activa = true where id = %s",
                (apagada,),
            )

            conexion.rollback()

    print(f"\n{len(casos)} casos · {fallos} fallos")
    sys.exit(1 if fallos else 0)


if __name__ == "__main__":
    main()
