#!/usr/bin/env python3
"""Prueba de `scripts/procesar-fotos.py` con una exportación de WhatsApp sintética.

Comprueba el listón F del módulo de ingesta de fotografías:
duplicados, capturas, baja resolución, vídeo ignorado, formatos de salida,
índice SQLite, idempotencia y que los originales no se tocan.

Uso: python3 scripts/probar-procesar-fotos.py
Sale 0 solo si todas las comprobaciones pasan.
"""

from __future__ import annotations

import hashlib
import io
import sqlite3
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
PROCESADOR = RAIZ / "scripts" / "procesar-fotos.py"

fallos: list[str] = []
pasos = 0


def comprobar(condicion: bool, descripcion: str, detalle: str = "") -> None:
    global pasos
    pasos += 1
    if condicion:
        print(f"  ✔ {descripcion}")
    else:
        print(f"  ✘ {descripcion}" + (f" — {detalle}" if detalle else ""))
        fallos.append(descripcion)


def ruido(ancho: int, alto: int, semilla: int) -> bytes:
    """JPEG con textura: el ruido da bordes, así que pasa el umbral de nitidez."""
    img = Image.effect_noise((ancho, alto), 70 + semilla).convert("RGB")
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=90)
    return buf.getvalue()


def construir_exportacion(destino: Path) -> dict[str, bytes]:
    """Arma un .zip con la forma de una exportación de WhatsApp."""
    buena = ruido(1500, 2000, 1)
    otra = ruido(1600, 1200, 2)
    captura = io.BytesIO()
    Image.new("RGB", (1080, 1920), (230, 230, 230)).save(captura, "PNG")
    chica = ruido(300, 400, 3)

    contenido = {
        "WhatsApp Chat con Proveedores/IMG-20261020-WA0001.jpg": buena,
        "WhatsApp Chat con Proveedores/IMG-20261020-WA0001 (1).jpg": buena,  # duplicado exacto
        "WhatsApp Chat con Proveedores/IMG-20261021-WA0002.jpg": otra,
        "WhatsApp Chat con Proveedores/Screenshot_2026-10-27-10-15-00.png": captura.getvalue(),
        "WhatsApp Chat con Proveedores/IMG-20261022-WA0003.jpg": chica,
        "WhatsApp Chat con Proveedores/VID-20261022-WA0004.mp4": b"\x00\x00\x00\x18ftypmp42" + b"\x00" * 200,
        "WhatsApp Chat con Proveedores/_chat.txt": "27/10/2026 - Mensajes y llamadas cifrados\n".encode(),
    }

    with zipfile.ZipFile(destino, "w", zipfile.ZIP_DEFLATED) as z:
        for nombre, datos in contenido.items():
            z.writestr(nombre, datos)
    return contenido


def correr(entrada: Path, carpeta: Path) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, str(PROCESADOR), "--entrada", str(entrada), "--carpeta", str(carpeta)],
        capture_output=True, text=True,
    )


def filas(carpeta: Path) -> list[sqlite3.Row]:
    con = sqlite3.connect(carpeta / "indice.sqlite")
    con.row_factory = sqlite3.Row
    datos = con.execute("SELECT * FROM archivos ORDER BY origen").fetchall()
    con.close()
    return datos


def main() -> int:
    if not PROCESADOR.exists():
        print(f"✘ no existe {PROCESADOR}")
        return 1

    with tempfile.TemporaryDirectory(prefix="prueba-fotos-") as tmp:
        tmpdir = Path(tmp)
        exportacion = tmpdir / "WhatsApp Chat con Proveedores.zip"
        contenido = construir_exportacion(exportacion)
        huella_antes = hashlib.sha256(exportacion.read_bytes()).hexdigest()
        salida = tmpdir / "salida"

        print("F1 · Procesa el .zip y no toca el original")
        r = correr(exportacion, salida)
        comprobar(r.returncode == 0, "el procesador termina en 0", r.stderr.strip()[-300:])
        comprobar(hashlib.sha256(exportacion.read_bytes()).hexdigest() == huella_antes,
                  "el .zip de entrada queda intacto")

        datos = filas(salida)
        estados = {f["origen"]: f["estado"] for f in datos}

        print("F2 · Deduplicación por SHA-256")
        comprobar(len(datos) == 4, "4 filas para 5 imágenes (una duplicada)", f"hay {len(datos)}")

        print("F3 · Inspección de los estados")
        comprobar(estados.get("IMG-20261020-WA0001.jpg") == "pendiente",
                  "la foto buena queda pendiente", str(estados))
        comprobar(estados.get("IMG-20261021-WA0002.jpg") == "pendiente",
                  "la segunda foto buena queda pendiente", str(estados))
        comprobar(estados.get("Screenshot_2026-10-27-10-15-00.png") == "revisar",
                  "la captura de pantalla va a revisar", str(estados))
        comprobar(estados.get("IMG-20261022-WA0003.jpg") == "descartada",
                  "la imagen diminuta se descarta", str(estados))
        motivos = {f["origen"]: f["motivo"] for f in datos}
        comprobar("baja_resolucion" in (motivos.get("IMG-20261022-WA0003.jpg") or ""),
                  "el motivo de descarte queda escrito", str(motivos))
        comprobar("posible_captura" == motivos.get("Screenshot_2026-10-27-10-15-00.png"),
                  "el motivo de la captura queda escrito", str(motivos))

        print("F1b · Vídeo ignorado, no registrado como foto")
        comprobar(not any("mp4" in f["origen"] for f in datos), "el .mp4 no entra en el índice")
        comprobar("1 vídeo" in r.stdout, "el resumen cuenta el vídeo", r.stdout.strip()[-200:])

        print("F4 · Formato no soportado")
        # Un archivo con extensión de imagen y contenido que no es imagen.
        roto = tmpdir / "roto"
        roto.mkdir()
        (roto / "IMG-20261023-WA0009.jpg").write_bytes(b"no soy una imagen")
        r2 = correr(roto, tmpdir / "salida2")
        datos2 = filas(tmpdir / "salida2")
        comprobar(r2.returncode == 0, "no revienta con un archivo corrupto", r2.stderr.strip()[-200:])
        comprobar(len(datos2) == 1 and datos2[0]["estado"] == "no_soportado",
                  "queda registrado como no_soportado", str([(f["origen"], f["estado"]) for f in datos2]))

        print("F5 · WebP principal y miniatura, sin recorte destructivo")
        grandes = sorted((salida / "grandes").glob("*.webp"))
        minis = sorted((salida / "miniaturas").glob("*.webp"))
        comprobar(len(grandes) == 4 and len(minis) == 4, "4 principales y 4 miniaturas",
                  f"{len(grandes)} y {len(minis)}")
        anchos = []
        for f in grandes:
            with Image.open(f) as im:
                anchos.append(max(im.size))
        comprobar(all(a <= 1600 for a in anchos), "ningún principal supera 1600 px", str(anchos))
        with Image.open(grandes[0]) as im:
            comprobar(max(im.size) == 1600 or max(im.size) == 1500,
                      "el principal conserva la proporción original", str(im.size))
        for f in minis:
            with Image.open(f) as im:
                comprobar(max(im.size) <= 480, f"miniatura {f.name} <= 480 px", str(im.size))

        print("F6 · Idempotencia del índice")
        r3 = correr(exportacion, salida)
        comprobar("Nuevas: 0" in r3.stdout, "reprocesar no añade fotos", r3.stdout.strip()[-200:])
        comprobar(len(filas(salida)) == 4, "el índice sigue con 4 filas")
        comprobar(len(sorted((salida / "grandes").glob("*.webp"))) == 4,
                  "no se duplican los archivos de salida")

        print("F7 · Nada se publica solo")
        comprobar(all(f["estado"] != "publicada" for f in filas(salida)),
                  "ninguna foto queda publicada por el procesador")
        comprobar(all(f["codigo_producto"] is None for f in filas(salida)),
                  "ninguna foto queda asignada a un producto")

        print("F8 · Datos de origen en el índice")
        primera = [f for f in datos if f["origen"] == "IMG-20261020-WA0001.jpg"][0]
        comprobar(primera["chat"] == "Proveedores", "se deduce el nombre del chat", str(primera["chat"]))
        comprobar(primera["fecha_foto"] == "2026-10-20", "se deduce la fecha del nombre",
                  str(primera["fecha_foto"]))
        comprobar(primera["ancho"] == 1500 and primera["alto"] == 2000,
                  "se guardan las dimensiones originales", f'{primera["ancho"]}x{primera["alto"]}')
        comprobar(len(primera["sha256"]) == 64, "se guarda el SHA-256 completo")
        comprobar(primera["veces_visto"] == 2, "la foto repetida se cuenta, no se duplica",
                  str(primera["veces_visto"]))

    print()
    if fallos:
        print(f"Fallos: {len(fallos)} de {pasos}. No se entrega.")
        for f in fallos:
            print(f"  · {f}")
        return 1
    print(f"Todo en verde: {pasos} comprobaciones.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
