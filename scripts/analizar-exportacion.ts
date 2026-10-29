/**
 * Lee una exportación de chat de WhatsApp y dice qué se puede convertir en
 * producto. No escribe nada: sirve para ver el estado real de una exportación
 * antes de conectar la automatización.
 *
 *   node --experimental-strip-types scripts/analizar-exportacion.ts <chat.txt> [marca,marca]
 */

import { readFileSync } from "node:fs";
import { interpretarPublicacion } from "../src/lib/interpretar.ts";
import { publicaciones, separarMensajes } from "../src/lib/leerExportacion.ts";

const ruta = process.argv[2];
if (!ruta) {
  console.error("Falta la ruta del chat.txt");
  process.exit(2);
}

const marcas = (process.argv[3] ?? "").split(",").map((m) => m.trim()).filter(Boolean);
const mensajes = separarMensajes(readFileSync(ruta, "utf8"));
const sistema = mensajes.filter((m) => m.esSistema).length;
const candidatas = publicaciones(mensajes);

console.log(`\nMensajes: ${mensajes.length} · avisos del sistema: ${sistema} · publicaciones candidatas: ${candidatas.length}\n`);

const cuenta = { alta: 0, media: 0, baja: 0 };

for (const [i, m] of candidatas.entries()) {
  const r = interpretarPublicacion(m.texto, marcas);
  cuenta[r.confianza] += 1;

  const autor = m.autor ?? "(sin autor)";
  console.log(`${i + 1}. ${autor} · ${m.cuando}`);
  console.log(`   modelo: ${r.modelo ?? "—"} | marca: ${r.marca ?? "—"} | precio: ${r.precio ?? "—"} | tallas: ${r.tallas.join(",") || "—"}`);
  if (r.faltantes.length) console.log(`   falta: ${r.faltantes.join(", ")} · confianza ${r.confianza}`);
}

if (candidatas.length === 0) {
  console.log("No hay ninguna publicación que convertir.");
}

console.log(`\nResumen por confianza: alta ${cuenta.alta} · media ${cuenta.media} · baja ${cuenta.baja}\n`);
