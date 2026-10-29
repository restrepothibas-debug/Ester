/**
 * Pruebas del lector de exportaciones de WhatsApp.
 *
 *   node --experimental-strip-types scripts/probar-exportacion.ts
 *
 * Los dos primeros casos son las líneas reales de una exportación de iOS
 * (comunidad de mayoristas, 28/10/2026): son las que hoy llegan y son avisos
 * del sistema, no publicaciones.
 */

import { interpretarPublicacion } from "../src/lib/interpretar.ts";
import { publicaciones, separarMensajes } from "../src/lib/leerExportacion.ts";

let pasadas = 0;
let falladas = 0;

function comprobar(nombre: string, real: unknown, esperado: unknown): void {
  const a = JSON.stringify(real);
  const b = JSON.stringify(esperado);
  if (a === b) {
    pasadas += 1;
    console.log(`  ✔ ${nombre}`);
  } else {
    falladas += 1;
    console.log(`  ✖ ${nombre}\n      esperado: ${b}\n      obtenido: ${a}`);
  }
}

console.log("\nExportación de WhatsApp\n");

// 1 · Cabecera real de iOS.
{
  const texto = [
    "Los mensajes y las llamadas están cifrados de extremo a extremo. Nadie fuera de este chat, ni siquiera WhatsApp, puede leerlos ni escucharlos.",
    "[1/19/26, 11:03:24 PM] - [Notificación del sistema]",
    "[1/19/26, 11:03:24 PM] - Alguien añadió a Tú",
    "[10/19/26, 9:25:33 AM] - Este chat ofrece mayor privacidad para tu número de teléfono. Haz clic para obtener más información.",
  ].join("\n");
  const m = separarMensajes(texto);
  comprobar("se leen los tres avisos del sistema", m.length, 3);
  comprobar("ninguno es publicación", m.filter((x) => x.esSistema).length, 3);
  comprobar("la cabecera sin fecha se ignora", m.some((x) => x.texto.startsWith("Los mensajes")), false);
}

// 2 · Publicación de iOS con varias líneas.
{
  const texto = [
    "[10/26/26, 10:15:02 AM] - Proveedora Cali: Botín Aurora - $159.000",
    "Tallas: 36,37,38",
    "Colores: negro, café",
    "[10/26/26, 10:16:40 AM] - Proveedora Cali: Tenis running 165k tallas 40,41",
  ].join("\n");
  const m = separarMensajes(texto);
  comprobar("dos mensajes, no cinco líneas", m.length, 2);
  comprobar("autor separado del texto", m[0].autor, "Proveedora Cali");
  comprobar("las líneas siguientes se unen", m[0].texto.includes("Colores: negro, café"), true);
}

// 3 · Formato de Android.
{
  const m = separarMensajes("19/1/26 23:03 - Proveedor: Sandalia 120.000 tallas 37");
  comprobar("se reconoce el formato de Android", m.length, 1);
  comprobar("autor de Android", m[0].autor, "Proveedor");
  comprobar("texto de Android", m[0].texto, "Sandalia 120.000 tallas 37");
}

// 4 · Un autor con dos puntos dentro del texto.
{
  const m = separarMensajes("[10/26/26, 10:20:00 AM] - Proveedor: Modelo: Camelia");
  comprobar("el primer «:» separa autor y texto", m[0].autor, "Proveedor");
  comprobar("el resto queda en el texto", m[0].texto, "Modelo: Camelia");
}

// 5 · Filtro de publicaciones.
{
  const m = separarMensajes(
    [
      "[10/26/26, 9:00:00 AM] - [Notificación del sistema]",
      "[10/26/26, 9:01:00 AM] - Proveedor: listo",
      "[10/26/26, 9:02:00 AM] - Proveedor: Botín Aurora $159.000 tallas 36,37,38",
    ].join("\n"),
  );
  comprobar("el aviso y el «listo» no cuentan", publicaciones(m).length, 1);
}

// 6 · De la exportación al producto, de punta a punta.
{
  const m = separarMensajes("[10/26/26, 9:02:00 AM] - Aurora: Botín Aurora $159.000 tallas 36,37,38");
  const r = interpretarPublicacion(publicaciones(m)[0].texto, ["Aurora"]);
  comprobar("precio desde la exportación", r.precio, 159000);
  comprobar("tallas desde la exportación", r.tallas, [36, 37, 38]);
  comprobar("marca desde la exportación", r.marca, "Aurora");
  comprobar("confianza alta", r.confianza, "alta");
}

// 7 · Archivo vacío o con una sola cabecera.
{
  comprobar("archivo vacío", separarMensajes(""), []);
  comprobar("solo cabecera", separarMensajes("Los mensajes están cifrados."), []);
}

console.log(`\n${falladas === 0 ? "Todo en verde" : "Hay fallos"}: ${pasadas} comprobaciones, ${falladas} fallidas.\n`);
process.exit(falladas === 0 ? 0 : 1);
