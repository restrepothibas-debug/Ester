#!/usr/bin/env bash
# Aplica las migraciones de supabase/migrations en orden.
#
# Uso:
#   export SUPABASE_ACCESS_TOKEN=sbp_...      # opción A, recomendada
#   ./scripts/aplicar-migraciones.sh
#
#   export SUPABASE_DB_URL='postgresql://...'  # opción B, requiere psql
#   ./scripts/aplicar-migraciones.sh
#
# No hace nada destructivo por sí mismo: solo ejecuta los .sql versionados.
set -euo pipefail

REF="${SUPABASE_PROJECT_REF:-pklqdjixkhpkmtrhtzsm}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/supabase/migrations"

if [[ ! -d "$DIR" ]]; then
  echo "No existe $DIR" >&2
  exit 1
fi

archivos=($(ls -1 "$DIR"/*.sql | sort))
echo "Migraciones a aplicar: ${#archivos[@]}"
for f in "${archivos[@]}"; do echo "  - $(basename "$f")"; done

if [[ -n "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "→ Vía: Management API (proyecto $REF)"
  for f in "${archivos[@]}"; do
    nombre="$(basename "$f")"
    echo "→ Aplicando $nombre"
    cuerpo="$(python3 -c 'import json,sys; print(json.dumps({"query": open(sys.argv[1], encoding="utf-8").read()}))' "$f")"
    respuesta="$(curl -sS -w '\n%{http_code}' -X POST \
      "https://api.supabase.com/v1/projects/${REF}/database/query" \
      -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
      -H "Content-Type: application/json" \
      --data-binary "$cuerpo")"
    codigo="$(echo "$respuesta" | tail -n1)"
    contenido="$(echo "$respuesta" | sed '$d')"
    if [[ "$codigo" =~ ^2 ]]; then
      echo "   OK ($codigo)"
    else
      echo "   FALLÓ ($codigo): $contenido" >&2
      echo "   Se detiene aquí. Las migraciones anteriores quedaron aplicadas." >&2
      exit 1
    fi
  done
  echo "Listo."

elif [[ -n "${SUPABASE_DB_URL:-}" ]]; then
  if ! command -v psql >/dev/null 2>&1; then
    echo "psql no está instalado. Usa la opción A (SUPABASE_ACCESS_TOKEN)." >&2
    exit 1
  fi
  echo "→ Vía: psql directo"
  for f in "${archivos[@]}"; do
    echo "→ Aplicando $(basename "$f")"
    psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "$f"
  done
  echo "Listo."

else
  echo "Falta SUPABASE_ACCESS_TOKEN (opción A) o SUPABASE_DB_URL (opción B)." >&2
  exit 1
fi
