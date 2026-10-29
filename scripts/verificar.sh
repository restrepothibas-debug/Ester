#!/usr/bin/env bash
# Verificación automática del listón (00-docs/06-metodo/liston.md).
# Cubre lo que una máquina puede comprobar: A1, A2, A3 y parte de A6.
# Lo que exige un navegador o criterio humano lo hace el árbitro.
#
# Uso: ./scripts/verificar.sh
set -uo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 1

fallos=0
ok()    { printf '  \033[32m✔\033[0m %s\n' "$1"; }
mal()   { printf '  \033[31m✘\033[0m %s\n' "$1"; fallos=$((fallos+1)); }
aviso() { printf '  \033[33m!\033[0m %s\n' "$1"; }

echo "A1 · Compilación y tipos"
if npm run build >/tmp/verificar-build.log 2>&1; then
  ok "npm run build terminó en 0"
else
  mal "npm run build falló (ver /tmp/verificar-build.log)"
  tail -20 /tmp/verificar-build.log
fi

echo "A2 · Lint"
# El estado de salida de oxlint es la señal fiable: 0 con avisos, distinto de 0
# con errores. Antes se buscaba la palabra «error» en la salida y cualquier
# fragmento de código citado (por ejemplo `error: null`) daba un falso fallo.
salida_lint="$(npm run lint 2>&1)"
estado_lint=$?
if [ "$estado_lint" -ne 0 ]; then
  mal "npm run lint terminó en $estado_lint"
  echo "$salida_lint" | tail -10
else
  # Se cuentan las líneas de diagnóstico, no un resumen: oxlint no siempre
  # imprime la línea «Found N warnings» cuando la salida va por una tubería.
  avisos="$(printf '%s\n' "$salida_lint" | grep -c ': warning ' || true)"
  ok "npm run lint terminó en 0 (${avisos:-0} avisos)"
fi

echo "A1b · Tipografía sin dependencia externa"
# La tipografía se sirve desde el propio dominio. Si alguien vuelve a enlazar
# Google Fonts, el catálogo deja de ser autónomo y esto lo detecta.
if grep -rIn -E "fonts\.(googleapis|gstatic)\.com" index.html src 2>/dev/null; then
  mal "el código vuelve a pedir tipografías a Google"
else
  ok "ninguna referencia a Google Fonts en index.html ni en src/"
fi
if [ -d dist ] && grep -rIl -E "fonts\.(googleapis|gstatic)\.com" dist 2>/dev/null | grep -q .; then
  mal "el bundle compilado pide tipografías a Google"
else
  ok "el bundle compilado no pide tipografías a Google"
fi
faltan_fuentes=0
for f in public/fuentes/*.woff2; do
  [ -e "$f" ] || { mal "no hay archivos .woff2 en public/fuentes/"; faltan_fuentes=1; break; }
  if [ "$(head -c 4 "$f")" != "wOF2" ]; then
    mal "$f no es un WOFF2 válido"
    faltan_fuentes=1
  fi
done
[ "$faltan_fuentes" -eq 0 ] && ok "$(ls public/fuentes/*.woff2 | wc -l | tr -d ' ') fuentes locales en formato WOFF2"
for lic in public/fuentes/OFL-*.txt; do
  [ -e "$lic" ] || { mal "falta la licencia OFL de las fuentes"; break; }
done

echo "A1c · Procesador de fotografías"
if python3 -c "import PIL" >/dev/null 2>&1; then
  if python3 scripts/probar-procesar-fotos.py >/tmp/verificar-fotos.log 2>&1; then
    ok "$(tail -1 /tmp/verificar-fotos.log)"
  else
    mal "la prueba del procesador de fotografías falla"
    tail -8 /tmp/verificar-fotos.log
  fi
else
  aviso "Pillow no está disponible: se omite la prueba del procesador"
fi

echo "A1d · Fotografías de producto (base)"
if PYTHONPATH=.venv-libs python3 -c "import psycopg" >/dev/null 2>&1; then
  if PYTHONPATH=.venv-libs python3 scripts/probar-fotos.py >/tmp/verificar-fotos-db.log 2>&1; then
    ok "reglas de fotos en verde ($(grep -c '✔' /tmp/verificar-fotos-db.log) comprobaciones)"
  elif grep -qE "OperationalError|could not receive data|Connection refused|timeout expired" /tmp/verificar-fotos-db.log; then
    # Un corte de red no es un fallo del código: se avisa y se sigue. Un fallo
    # de aserción sí es un fallo.
    aviso "sin conexión con la base: no se pudieron comprobar las reglas de fotos"
  else
    mal "las reglas de fotos fallan"
    tail -8 /tmp/verificar-fotos-db.log
  fi
else
  aviso "psycopg no está disponible: se omiten las pruebas de base"
fi

echo "A1e · Interpretador de publicaciones"
if node --experimental-strip-types scripts/probar-interpretador.ts >/tmp/verificar-interpretador.log 2>&1; then
  ok "$(tail -2 /tmp/verificar-interpretador.log | head -1)"
else
  mal "el interpretador no pasa sus pruebas"
  tail -12 /tmp/verificar-interpretador.log
fi

echo "A1f · Bandeja de entrada de WhatsApp"
if PYTHONPATH=.venv-libs python3 -c "import psycopg" >/dev/null 2>&1; then
  if PYTHONPATH=.venv-libs python3 scripts/probar-ingesta.py >/tmp/verificar-ingesta.log 2>&1; then
    ok "bandeja en verde ($(grep -c '✔' /tmp/verificar-ingesta.log) comprobaciones)"
  elif grep -qE "OperationalError|could not receive data|Connection refused|timeout expired" /tmp/verificar-ingesta.log; then
    aviso "sin conexión con la base; se omite la prueba de la bandeja"
  else
    mal "la bandeja de entrada falla"
    tail -10 /tmp/verificar-ingesta.log
  fi
else
  aviso "psycopg no está disponible; se omite la prueba de la bandeja"
fi

echo "A1g · Lector de exportaciones"
if node --experimental-strip-types scripts/probar-exportacion.ts >/tmp/verificar-exportacion.log 2>&1; then
  ok "$(tail -2 /tmp/verificar-exportacion.log | head -1)"
else
  mal "el lector de exportaciones no pasa sus pruebas"
  tail -10 /tmp/verificar-exportacion.log
fi

echo "A3 · Secretos en archivos versionados"
# Regex extendida: macOS usa BSD grep, que no entiende \| en modo básico.
patrones='(sb_secret_|sbp_|ghp_)[A-Za-z0-9_-]{15,}|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{30,}'
# En el bundle la clave anon DEBE estar: es pública por diseño. Lo que no puede
# estar es una clave de servidor.
patrones_servidor='(sb_secret_|sbp_|ghp_)[A-Za-z0-9_-]{15,}'
# Se recorre el árbol completo, no solo lo versionado: un archivo nuevo con
# credenciales pasaría desapercibido con `git grep`.
excluir="--exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git --exclude-dir=.venv-libs --exclude=.env.local --exclude=.env"
if grep -rIq $excluir -E "$patrones" . 2>/dev/null; then
  mal "hay credenciales en el proyecto"
  grep -rIl $excluir -E "$patrones" . | head -5
else
  ok "ninguna credencial en el proyecto"
fi

if [ -d dist ]; then
  # Se busca una clave real, no el prefijo: supabase-js menciona "sb_secret_"
  # y "sb_publishable_" en su propio código, y eso no es una fuga.
  if grep -rIq -E "$patrones_servidor" dist 2>/dev/null; then
    mal "el bundle de dist contiene una credencial"
    grep -rIloE "$patrones_servidor" dist | head -3
  else
    ok "el bundle de dist no contiene credenciales"
  fi

  # Comprobación directa: que el valor real de la clave secreta no esté en dist.
  if [ -f .env.local ]; then
    secreta="$(grep '^SUPABASE_SECRET_KEY=' .env.local | cut -d= -f2- || true)"
    if [ -n "$secreta" ] && grep -rIq -- "$secreta" dist 2>/dev/null; then
      mal "la clave secreta de Supabase está incrustada en el bundle"
    else
      ok "la clave secreta no está en el bundle"
    fi
  fi
fi

echo "A3b · .env.local fuera de git"
if git check-ignore -q .env.local 2>/dev/null; then
  ok ".env.local ignorado por git"
else
  aviso ".env.local no existe o no está ignorado"
fi

echo "A6 · Textos de relleno"
# "TODO" y "FIXME" en mayúsculas y como palabra: en castellano "todo" y "todos"
# son palabras normales y no deben disparar el aviso.
relleno="$( { grep -rIn -i -E 'lorem ipsum|imagen aquí' src 2>/dev/null; \
              grep -rIn -E '\bTODO\b|\bFIXME\b' src 2>/dev/null; } || true )"
if [ -n "$relleno" ]; then
  mal "hay textos de relleno en src/ (lorem, imagen aquí, TODO o FIXME)"
  echo "$relleno" | head -5
else
  ok "sin textos de relleno"
fi

echo
if [ "$fallos" -eq 0 ]; then
  echo "Automatizable: todo pasa. Falta lo que exige navegador y criterio (listón A4-A9, B, C)."
  exit 0
else
  echo "Fallos: $fallos. No se entrega."
  exit 1
fi
