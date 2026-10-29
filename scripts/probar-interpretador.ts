/**
 * Pruebas del interpretador de publicaciones de WhatsApp.
 *
 * Se ejecuta con el runtime del proyecto, sin dependencias nuevas:
 *   node --experimental-strip-types scripts/probar-interpretador.ts
 *
 * Lo que se protege aquí es la regla del módulo: **no inventar**. Cada caso
 * declara qué debe quedar en `null` cuando el texto no lo dice.
 */

import { interpretarPublicacion } from "../src/lib/interpretar.ts";

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

const marcas = ["Aurora", "Camelia", "Vélez"];

console.log("\nPublicaciones reales de un catálogo de zapatos\n");

// 1 · Una sola línea, como se escribe en un estado de WhatsApp.
{
  const r = interpretarPublicacion("Botín Aurora - $159.000 - tallas 36,37,38", marcas);
  comprobar("modelo desde la primera línea", r.modelo, "Botín Aurora");
  comprobar("precio con puntos de miles", r.precio, 159000);
  comprobar("tallas separadas por coma", r.tallas, [36, 37, 38]);
  comprobar("marca reconocida del catálogo", r.marca, "Aurora");
  comprobar("confianza alta con los tres datos", r.confianza, "alta");
  comprobar("precio firme, no dudoso", r.precioDudoso, false);
}

// 2 · Formato con etiquetas y rango de tallas.
{
  const r = interpretarPublicacion(
    "Modelo: Camelia\nPrecio: 165.000\nTallas: 36 al 40\nColores: negro, café",
    marcas,
  );
  comprobar("modelo etiquetado", r.modelo, "Camelia");
  comprobar("rango de tallas expandido", r.tallas, [36, 37, 38, 39, 40]);
  comprobar("colores detectados", r.colores.length, 2);
  comprobar("marca Camelia", r.marca, "Camelia");
}

// 3 · «docena a 150»: no es el precio del par.
{
  const r = interpretarPublicacion("Docena a 150, botín en cuero", marcas);
  comprobar("no se inventa un precio de 150", r.precio, null);
  comprobar("se marca como dudoso", r.precioDudoso, true);
  comprobar("falta el precio", r.faltantes.includes("precio"), true);
}

// 4 · Cifra con sufijo «k».
{
  const r = interpretarPublicacion("Tenis running 165k tallas 40,41", marcas);
  comprobar("«165k» son 165.000", r.precio, 165000);
}

// 5 · Precio con decimales escritos a la colombiana.
{
  const r = interpretarPublicacion("Mocasín\n$ 159.000,00\nTallas: 38", marcas);
  comprobar("decimales no rompen la cifra", r.precio, 159000);
}

// 6 · Referencia como código, no como modelo.
{
  const r = interpretarPublicacion("Ref: AUR-01\nBotín en cuero\nTallas: 37", marcas);
  comprobar("código con guion", r.codigo, "AUR-01");
  comprobar("la referencia no se toma como modelo", r.modelo, "Botín en cuero");
}

// 7 · Rango de precios: se queda el menor y se marca.
{
  const r = interpretarPublicacion("Botín\nPrecio: 150.000 a 160.000\nTallas: 36", marcas);
  comprobar("rango toma el menor", r.precio, 150000);
  comprobar("rango marcado como dudoso", r.precioDudoso, true);
}

// 8 · Números que no son tallas si no se habla de tallas.
{
  const r = interpretarPublicacion("Camisa 36,37,38", marcas);
  comprobar("sin la palabra talla no se inventan tallas", r.tallas, []);
}

// 9 · Tallas que no deben convertirse en precio.
{
  const r = interpretarPublicacion("Botín\nTallas: 36,37,38", marcas);
  comprobar("«36,37,38» no es un precio", r.precio, null);
}

// 10 · Un teléfono no es un precio.
{
  const r = interpretarPublicacion("Botín\nTallas: 38\nWhatsApp 3001234567", marcas);
  comprobar("un teléfono no pasa por precio", r.precio, null);
}

// 11 · Texto sin datos: no se rellena nada.
{
  const r = interpretarPublicacion("Buenos días, ya llegó la mercancía nueva", marcas);
  comprobar("sin modelo", r.modelo, null);
  comprobar("sin precio", r.precio, null);
  comprobar("sin tallas", r.tallas, []);
  comprobar("confianza baja", r.confianza, "baja");
  comprobar("faltan los cuatro datos", r.faltantes, ["modelo", "precio", "tallas", "marca"]);
}

// 12 · Marca desconocida: no se inventa una marca.
{
  const r = interpretarPublicacion("Botín Zafiro\nPrecio: 180.000\nTallas: 39", marcas);
  comprobar("marca que no está en el catálogo", r.marca, null);
  comprobar("y se pide", r.faltantes.includes("marca"), true);
}

// 13 · Acentos: se reconoce igual escrito sin tilde.
{
  const r = interpretarPublicacion("Botín\nPrecio: 170.000\nTallas: 40\nColor: cafe", marcas);
  comprobar("color sin tilde", r.colores.includes("café"), true);
}

console.log(`\n${falladas === 0 ? "Todo en verde" : "Hay fallos"}: ${pasadas} comprobaciones, ${falladas} fallidas.\n`);
process.exit(falladas === 0 ? 0 : 1);
