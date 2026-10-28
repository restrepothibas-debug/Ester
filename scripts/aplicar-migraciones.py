#!/usr/bin/env python3
"""Aplica las migraciones pendientes de supabase/migrations.

Requiere psycopg. Si no está instalado en el sistema:

    python3 -m pip install --target .venv-libs 'psycopg[binary]'
    PYTHONPATH=.venv-libs python3 scripts/aplicar-migraciones.py

La cadena de conexión se lee de SUPABASE_DB_URL o de .env.local.
No se escribe ninguna credencial en este archivo.
"""
from __future__ import annotations

import os
import pathlib
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
MIGRACIONES = RAIZ / "supabase" / "migrations"


def leer_dsn() -> str:
    dsn = os.environ.get("SUPABASE_DB_URL", "").strip()
    if dsn:
        return dsn
    env = RAIZ / ".env.local"
    if env.exists():
        for linea in env.read_text(encoding="utf-8").splitlines():
            if linea.startswith("SUPABASE_DB_URL="):
                return linea.split("=", 1)[1].strip()
    print("Falta SUPABASE_DB_URL en el entorno o en .env.local", file=sys.stderr)
    raise SystemExit(1)


def main() -> None:
    try:
        import psycopg
    except ModuleNotFoundError:
        print(
            "psycopg no está instalado.\n"
            "python3 -m pip install --target .venv-libs 'psycopg[binary]'\n"
            "PYTHONPATH=.venv-libs python3 scripts/aplicar-migraciones.py",
            file=sys.stderr,
        )
        raise SystemExit(1)

    dsn = leer_dsn()
    archivos = sorted(MIGRACIONES.glob("*.sql"))
    if not archivos:
        print("No hay migraciones.")
        return

    with psycopg.connect(dsn, connect_timeout=20) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "select to_regclass('public.migraciones_aplicadas') is not null"
            )
            existe = cur.fetchone()[0]
            aplicadas: set[str] = set()
            if existe:
                cur.execute("select nombre from public.migraciones_aplicadas")
                aplicadas = {f[0] for f in cur.fetchall()}
        conn.commit()

        pendientes = [a for a in archivos if a.name not in aplicadas]
        print(f"aplicadas: {len(aplicadas)} · pendientes: {len(pendientes)}")
        for archivo in pendientes:
            print(f"→ {archivo.name}")
            try:
                with conn.cursor() as cur:
                    cur.execute(archivo.read_text(encoding="utf-8"))
                    cur.execute(
                        """create table if not exists public.migraciones_aplicadas (
                               nombre text primary key,
                               aplicada_en timestamptz not null default now()
                           )"""
                    )
                    cur.execute(
                        "insert into public.migraciones_aplicadas (nombre) values (%s) "
                        "on conflict (nombre) do nothing",
                        (archivo.name,),
                    )
                conn.commit()
                print("   aplicada")
            except Exception as error:  # noqa: BLE001
                conn.rollback()
                print(f"   ERROR: {str(error).splitlines()[0][:300]}", file=sys.stderr)
                raise SystemExit(1)

    print("Listo.")


if __name__ == "__main__":
    main()
