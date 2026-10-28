#!/usr/bin/env python3
"""Procesa una exportación de WhatsApp (o una carpeta) y deja las fotos listas
para el catálogo, con un índice SQLite que sobrevive entre tandas.

Qué hace, en orden:
  1. Descomprime el `.zip` en un directorio temporal (nunca toca los originales).
  2. Calcula el SHA-256 de cada imagen y descarta duplicados.
  3. Corrige la orientación EXIF, mide nitidez y clasifica cada foto.
  4. Exporta un WebP principal (lado mayor <= 1600 px) y una miniatura.
  5. Registra todo en `indice.sqlite`.

Nada se publica aquí: todo entra como `pendiente` o `revisar` y la asignación a
un producto es manual. El procesador no recorta: el encuadre de la tarjeta lo
resuelve el CSS.

Uso:
    python3 scripts/procesar-fotos.py --entrada fotos/entrada/WhatsApp.zip
    python3 scripts/procesar-fotos.py --entrada fotos/entrada/ --resumen

Requiere Pillow (`python3 -c "import PIL"`).
"""

from __future__ import annotations

import argparse
import hashlib
import io
import re
import sqlite3
import sys
import tempfile
import zipfile
from datetime import datetime, timezone
from pathlib import Path

try:
    from PIL import Image, ImageFilter, ImageOps, ImageStat
except ModuleNotFoundError:  # pragma: no cover - comprobación de entorno
    sys.exit("Falta Pillow. Instala con: python3 -m pip install --target .venv-libs Pillow")

# --------------------------------------------------------------------------- #
# Constantes
# --------------------------------------------------------------------------- #

EXTENSIONES_IMAGEN = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".gif", ".bmp", ".tif", ".tiff"}
EXTENSIONES_VIDEO = {".mp4", ".3gp", ".mov", ".mkv", ".avi", ".webm"}
EXTENSIONES_AUDIO = {".opus", ".ogg", ".mp3", ".m4a", ".aac", ".amr", ".wav"}

# Un lado menor que esto no sirve para una ficha de producto.
LADO_MINIMO = 600

# Umbral heurístico de nitidez (desviación del filtro de bordes). No decide:
# solo manda la foto a revisión para que la mire una persona.
NITIDEZ_MINIMA = 6.0

PATRON_CAPTURA = re.compile(r"(screenshot|captura|screen[\s_-]?shot|whatsapp image)", re.IGNORECASE)
# IMG-20261028-WA0012.jpg  ·  IMG-20261028-WA0012.jpg
PATRON_FECHA_NOMBRE = re.compile(r"(20\d{2})(\d{2})(\d{2})")
# WhatsApp añade « (1)», « (2)»… cuando repite un nombre.
RE_COPIA = re.compile(r"\(\d+\)$")

ESQUEMA = """
CREATE TABLE IF NOT EXISTS archivos (
    id                INTEGER PRIMARY KEY,
    sha256            TEXT    NOT NULL UNIQUE,
    origen            TEXT    NOT NULL,
    chat              TEXT,
    formato           TEXT,
    fecha_foto        TEXT,
    ancho             INTEGER,
    alto              INTEGER,
    bytes_origen      INTEGER,
    nitidez           REAL,
    estado            TEXT    NOT NULL,
    motivo            TEXT,
    archivo_principal TEXT,
    archivo_miniatura TEXT,
    codigo_producto   TEXT,
    veces_visto       INTEGER NOT NULL DEFAULT 1,
    creado_en         TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_archivos_estado ON archivos(estado);
"""


# --------------------------------------------------------------------------- #
# Utilidades
# --------------------------------------------------------------------------- #

def sha256_de(datos: bytes) -> str:
    return hashlib.sha256(datos).hexdigest()


def abrir_indice(ruta: Path) -> sqlite3.Connection:
    ruta.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(ruta)
    con.row_factory = sqlite3.Row
    con.executescript(ESQUEMA)
    return con


def fecha_de_nombre(nombre: str) -> str | None:
    m = PATRON_FECHA_NOMBRE.search(nombre)
    if not m:
        return None
    try:
        return datetime(int(m.group(1)), int(m.group(2)), int(m.group(3))).date().isoformat()
    except ValueError:
        return None


def fecha_exif(img: Image.Image) -> str | None:
    try:
        exif = img.getexif()
    except Exception:
        return None
    for etiqueta in (306, 36867):  # DateTime / DateTimeOriginal
        valor = exif.get(etiqueta)
        if isinstance(valor, str) and len(valor) >= 10:
            año, mes, dia = valor[:10].replace(":", "-").split("-")
            if año.isdigit() and mes.isdigit() and dia.isdigit():
                return f"{año}-{mes}-{dia}"
    return None


def nitidez(img: Image.Image) -> float:
    """Heurística barata: desviación de los bordes en una versión reducida."""
    gris = img.convert("L").resize((256, 256))
    bordes = gris.filter(ImageFilter.FIND_EDGES)
    return round(ImageStat.Stat(bordes).stddev[0], 2)


def nombre_chat(archivos: list[str]) -> str | None:
    """WhatsApp deja un `.txt` con la conversación; de ahí sale el nombre del chat.

    El archivo se llama `_chat.txt` dentro de una carpeta con el nombre del chat,
    o `WhatsApp Chat with <nombre>.txt` / `WhatsApp Chat con <nombre>.txt`.
    """
    for a in archivos:
        if not a.lower().endswith(".txt"):
            continue
        ruta = Path(a)
        candidato = ruta.parent.name if ruta.stem.lower() in ("_chat", "chat") else ruta.stem
        candidato = re.sub(r"^WhatsApp Chat (with|con)\s+", "", candidato, flags=re.IGNORECASE).strip()
        return candidato or None
    return None


def extraer(entrada: Path, destino: Path) -> tuple[Path, str | None]:
    """Devuelve la carpeta con los archivos y el nombre del chat, si se deduce."""
    if entrada.is_dir():
        return entrada, nombre_chat([str(p) for p in entrada.iterdir()])

    with zipfile.ZipFile(entrada) as z:
        nombres = [i.filename for i in z.infolist() if not i.is_dir()]
        chat = nombre_chat(nombres)
        for info in z.infolist():
            if info.is_dir():
                continue
            # Nunca escribir fuera del destino (zip slip).
            destino_archivo = (destino / info.filename).resolve()
            if not str(destino_archivo).startswith(str(destino.resolve())):
                continue
            destino_archivo.parent.mkdir(parents=True, exist_ok=True)
            with z.open(info) as origen, open(destino_archivo, "wb") as salida:
                salida.write(origen.read())
    return destino, chat


def clasificar(nombre: str, formato: str, ancho: int, alto: int, valor_nitidez: float) -> tuple[str, str | None]:
    """Devuelve (estado, motivo). El estado por defecto es `pendiente`."""
    if min(ancho, alto) < LADO_MINIMO:
        return "descartada", f"baja_resolucion:{ancho}x{alto}"
    if PATRON_CAPTURA.search(nombre) or (formato == "PNG" and not PATRON_CAPTURA.search(nombre) and ancho <= 1170):
        # Captura de pantalla: PNG de ancho típico de móvil o nombre explícito.
        return "revisar", "posible_captura"
    if valor_nitidez < NITIDEZ_MINIMA:
        return "revisar", f"posible_borrosa:nitidez={valor_nitidez}"
    return "pendiente", None


# --------------------------------------------------------------------------- #
# Proceso principal
# --------------------------------------------------------------------------- #

def procesar(entrada: Path, carpeta: Path, ancho_max: int, ancho_miniatura: int, calidad: int) -> dict:
    grandes = carpeta / "grandes"
    miniaturas = carpeta / "miniaturas"
    for d in (grandes, miniaturas):
        d.mkdir(parents=True, exist_ok=True)

    con = abrir_indice(carpeta / "indice.sqlite")
    resumen = {"nuevas": 0, "duplicadas": 0, "videos": 0, "audio": 0, "otros": 0,
               "no_soportado": 0, "pendiente": 0, "revisar": 0, "descartada": 0}

    with tempfile.TemporaryDirectory(prefix="fuentes-") as tmp:
        origen, chat = extraer(entrada, Path(tmp))
        # Los nombres limpios van primero: si el mismo archivo aparece como
        # «foto.jpg» y como «foto (1).jpg», el índice se queda con el limpio.
        archivos = sorted(
            (p for p in origen.rglob("*") if p.is_file()),
            key=lambda p: (bool(RE_COPIA.search(p.stem)), str(p)),
        )

        for ruta in archivos:
            ext = ruta.suffix.lower()
            if ext in EXTENSIONES_VIDEO:
                resumen["videos"] += 1
                continue
            if ext in EXTENSIONES_AUDIO:
                resumen["audio"] += 1
                continue
            if ext not in EXTENSIONES_IMAGEN:
                resumen["otros"] += 1
                continue

            datos = ruta.read_bytes()
            huella = sha256_de(datos)

            ya = con.execute("SELECT id FROM archivos WHERE sha256 = ?", (huella,)).fetchone()
            if ya:
                # La misma foto puede llegar en varios chats o repetida; se
                # cuenta, no se duplica el archivo.
                con.execute("UPDATE archivos SET veces_visto = veces_visto + 1 WHERE id = ?", (ya["id"],))
                con.commit()
                resumen["duplicadas"] += 1
                continue

            ahora = datetime.now(timezone.utc).isoformat(timespec="seconds")
            base = huella[:12]

            try:
                img = Image.open(io.BytesIO(datos))
                img.load()
                img = ImageOps.exif_transpose(img)
                formato = img.format or ext.lstrip(".").upper()
            except Exception as exc:  # HEIC sin soporte, archivo corrupto, etc.
                con.execute(
                    "INSERT INTO archivos (sha256, origen, chat, estado, motivo, bytes_origen, creado_en)"
                    " VALUES (?,?,?,?,?,?,?)",
                    (huella, ruta.name, chat, "no_soportado", f"formato_no_soportado:{type(exc).__name__}",
                     len(datos), ahora),
                )
                con.commit()
                resumen["no_soportado"] += 1
                continue

            ancho, alto = img.size
            valor_nitidez = nitidez(img)
            estado, motivo = clasificar(ruta.name, formato, ancho, alto, valor_nitidez)

            principal = grandes / f"{base}.webp"
            mini = miniaturas / f"{base}.webp"

            copia = img.convert("RGB") if img.mode not in ("RGB", "L") else img
            if max(copia.size) > ancho_max:
                copia.thumbnail((ancho_max, ancho_max), Image.LANCZOS)
            copia.save(principal, "WEBP", quality=calidad, method=4)

            chica = copia.copy()
            chica.thumbnail((ancho_miniatura, ancho_miniatura), Image.LANCZOS)
            chica.save(mini, "WEBP", quality=calidad, method=4)

            con.execute(
                "INSERT INTO archivos (sha256, origen, chat, formato, fecha_foto, ancho, alto,"
                " bytes_origen, nitidez, estado, motivo, archivo_principal, archivo_miniatura, creado_en)"
                " VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (huella, ruta.name, chat, formato, fecha_exif(img) or fecha_de_nombre(ruta.name),
                 ancho, alto, len(datos), valor_nitidez, estado, motivo,
                 str(principal.relative_to(carpeta)), str(mini.relative_to(carpeta)), ahora),
            )
            con.commit()

            resumen["nuevas"] += 1
            resumen[estado] = resumen.get(estado, 0) + 1

    con.close()
    return resumen


def imprimir_resumen(carpeta: Path) -> None:
    con = abrir_indice(carpeta / "indice.sqlite")
    filas = con.execute("SELECT estado, COUNT(*) n FROM archivos GROUP BY estado ORDER BY n DESC").fetchall()
    total = con.execute("SELECT COUNT(*) FROM archivos").fetchone()[0]
    print(f"\nÍndice: {carpeta / 'indice.sqlite'} · {total} archivo(s) registrado(s)")
    for f in filas:
        print(f"  {f['estado']:<14} {f['n']}")
    pendientes = con.execute(
        "SELECT origen, motivo FROM archivos WHERE estado IN ('pendiente','revisar') ORDER BY creado_en DESC LIMIT 10"
    ).fetchall()
    if pendientes:
        print("  Pendientes de revisión humana:")
        for p in pendientes:
            print(f"    · {p['origen']} — {p['motivo'] or 'sin motivo'}")
    con.close()


def main() -> int:
    ap = argparse.ArgumentParser(description="Procesa una exportación de WhatsApp para el catálogo.")
    ap.add_argument("--entrada", type=Path, help="Archivo .zip o carpeta de exportación")
    ap.add_argument("--carpeta", type=Path, default=Path("fotos"), help="Carpeta de salida (por defecto fotos/)")
    ap.add_argument("--ancho", type=int, default=1600, help="Lado mayor del WebP principal")
    ap.add_argument("--miniatura", type=int, default=480, help="Lado mayor de la miniatura")
    ap.add_argument("--calidad", type=int, default=82, help="Calidad WebP (0-100)")
    ap.add_argument("--resumen", action="store_true", help="Solo muestra el estado del índice")
    args = ap.parse_args()

    if args.resumen:
        imprimir_resumen(args.carpeta)
        return 0

    if not args.entrada:
        ap.error("falta --entrada (o usa --resumen)")
    if not args.entrada.exists():
        print(f"No existe: {args.entrada}", file=sys.stderr)
        return 2

    antes = sha256_de(args.entrada.read_bytes()) if args.entrada.is_file() else None
    resumen = procesar(args.entrada, args.carpeta, args.ancho, args.miniatura, args.calidad)
    despues = sha256_de(args.entrada.read_bytes()) if args.entrada.is_file() else None

    print(f"\nNuevas: {resumen['nuevas']} · duplicadas: {resumen['duplicadas']} · "
          f"no soportadas: {resumen['no_soportado']}")
    print(f"Ignorados: {resumen['videos']} vídeo(s), {resumen['audio']} audio, {resumen['otros']} otro(s)")
    print(f"Estados: pendiente {resumen.get('pendiente', 0)} · revisar {resumen.get('revisar', 0)} · "
          f"descartada {resumen.get('descartada', 0)}")
    if antes and despues and antes != despues:
        print("AVISO: la exportación de entrada cambió durante el proceso", file=sys.stderr)
        return 3
    imprimir_resumen(args.carpeta)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
