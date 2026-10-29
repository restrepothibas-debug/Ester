/**
 * Interpretación de una publicación de WhatsApp (texto libre) para convertirla
 * en un producto en borrador.
 *
 * Regla que manda sobre todo lo demás: **no adivinar**. Si un dato no está
 * escrito, queda en `null` y aparece en `faltantes`. Un precio inventado en un
 * catálogo que cierra la venta por WhatsApp se convierte en un problema con el
 * cliente, y un catálogo que miente una vez deja de usarse.
 *
 * Por eso el resultado no es «el producto», es una propuesta con su nivel de
 * confianza y la lista de lo que una persona tiene que mirar.
 */

export type Confianza = "alta" | "media" | "baja";

export interface Interpretacion {
  modelo: string | null;
  marca: string | null;
  codigo: string | null;
  precio: number | null;
  precioDudoso: boolean;
  tallas: number[];
  colores: string[];
  notas: string[];
  faltantes: string[];
  confianza: Confianza;
}

const COLORES = [
  "negro", "negros", "blanco", "blancos", "beige", "café", "cafe", "marrón", "marron",
  "camel", "habano", "rojo", "roja", "vino", "azul", "azulino", "verde", "gris",
  "nude", "dorado", "plateado", "rosado", "morado", "amarillo", "naranja", "taupe",
  "crema", "hueso", "chocolate", "cobre",
];

/** Quita acentos para comparar sin depender de cómo los escriba el proveedor. */
function plegar(texto: string): string {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function limpiar(linea: string): string {
  return linea.replace(/^[\s*_•\-–—>]+/, "").trim();
}

/**
 * Precio en pesos. Devuelve null cuando el número no es plausible como precio
 * de un par de zapatos, en vez de devolver una cifra dudosa.
 */
function leerPrecio(texto: string): { valor: number | null; dudoso: boolean; nota?: string } {
  // Las tallas se escriben igual que un precio («36,37,38»): se quitan antes de
  // buscar cifras para que no se confundan con 363.738 pesos.
  const plano = plegar(texto).replace(/\b\d{2}(?:\s*[,/-]\s*\d{2})+\b/g, " ");

  // "docena", "par", "las dos" cambian la unidad: no es el precio del par.
  const porMayor = /\bdocena\b|\bx\s?12\b|\bpor mayor\b/.test(plano);

  // Rangos y "desde": se queda el menor, pero se marca.
  const rango = plano.match(/(\d[\d.,]*)\s*(?:-|a|hasta)\s*(\d[\d.,]*)\s*(k|mil)?/);

  const conEtiqueta = plano.match(/(?:precio|valor|vale|cuesta)\s*:?\s*\$?\s*(\d[\d.,]*)\s*(k|mil)?/);
  const conSimbolo = plano.match(/\$\s*(\d[\d.,]*)\s*(k|mil)?/);
  const suelto = plano.match(/(?:^|\s)(\d[\d.,]{2,})\s*(k|mil)?(?:\s|$)/);

  const elegido = conEtiqueta ?? conSimbolo ?? (rango ? [rango[0], rango[1], rango[3]] : null) ?? suelto;
  if (!elegido) return { valor: null, dudoso: false };

  let cifra = elegido[1] ?? "";
  const sufijo = (elegido[2] ?? "").trim();

  // Formato colombiano: punto de miles, coma decimal.
  cifra = cifra.replace(/\./g, "").replace(/,(\d{2})$/, ".$1").replace(/,/g, "");

  let valor = Number(cifra);
  if (!Number.isFinite(valor)) return { valor: null, dudoso: false };

  if (sufijo === "k" || sufijo === "mil") valor *= 1000;

  // Un par de zapatos en Colombia no baja de 40.000 ni pasa de 2.000.000.
  // Fuera de ahí, el número es otra cosa (una talla, un año, un teléfono).
  if (valor < 40000 || valor > 2000000) {
    return { valor: null, dudoso: true, nota: "el número no parece un precio de un par" };
  }

  if (porMayor) return { valor, dudoso: true, nota: "precio por docena o al por mayor" };
  if (rango) return { valor, dudoso: true, nota: "el texto da un rango de precios" };

  return { valor, dudoso: false };
}

/** Tallas numéricas colombianas, solo cuando el texto habla de tallas. */
function leerTallas(texto: string): number[] {
  const plano = plegar(texto);
  const hablaDeTallas = /talla|tallas|numeros|numeros|medidas|\bdel\s+\d+\s+al\b/.test(plano);
  if (!hablaDeTallas) return [];

  const encontradas = new Set<number>();

  for (const r of plano.matchAll(/(\d{2})\s*(?:-|al|a|hasta)\s*(\d{2})/g)) {
    const desde = Number(r[1]);
    const hasta = Number(r[2]);
    if (desde >= 30 && hasta <= 46 && hasta >= desde && hasta - desde <= 12) {
      for (let t = desde; t <= hasta; t += 1) encontradas.add(t);
    }
  }

  for (const r of plano.matchAll(/\b(3[0-9]|4[0-6])\b/g)) {
    encontradas.add(Number(r[1]));
  }

  return [...encontradas].sort((a, b) => a - b);
}

function leerColores(texto: string): string[] {
  const plano = plegar(texto);
  const vistos = new Set<string>();
  for (const color of COLORES) {
    if (new RegExp(`\\b${color}\\b`).test(plano)) vistos.add(color === "cafe" ? "café" : color === "marron" ? "marrón" : color);
  }
  return [...vistos];
}

/** Marca: solo si aparece escrita y coincide con una marca que ya existe. */
function leerMarca(texto: string, conocidas: string[]): string | null {
  const plano = plegar(texto);
  for (const marca of conocidas) {
    const buscada = plegar(marca);
    if (buscada.length < 3) continue;
    if (new RegExp(`(^|[^a-z0-9])${buscada.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`).test(plano)) {
      return marca;
    }
  }
  return null;
}

function leerEtiquetado(lineas: string[], etiquetas: string[]): string | null {
  for (const linea of lineas) {
    const limpia = limpiar(linea);
    for (const etiqueta of etiquetas) {
      const m = limpia.match(new RegExp(`^${etiqueta}\\s*:?\\s*(.+)$`, "i"));
      if (m && m[1].trim().length >= 2) return m[1].trim();
    }
  }
  return null;
}

/**
 * Interpreta una publicación. `marcasConocidas` son las marcas que ya existen
 * en el catálogo: el texto solo se asocia a una de ellas, nunca se inventa una
 * marca nueva a partir de una palabra suelta.
 */
export function interpretarPublicacion(texto: string, marcasConocidas: string[] = []): Interpretacion {
  const lineas = texto.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const notas: string[] = [];

  const modeloEtiquetado = leerEtiquetado(lineas, ["modelo", "nombre del producto", "producto"]);
  let modelo = modeloEtiquetado;

  const precio = leerPrecio(texto);
  const tallas = leerTallas(texto);

  if (!modelo) {
    // Sin etiqueta solo se deduce un nombre si el mensaje parece un aviso de
    // producto (trae precio o tallas) y la línea no es una etiqueta ni un
    // saludo. Un «buenos días» no es el nombre de un modelo.
    const pareceAviso = precio.valor !== null || tallas.length > 0;
    if (pareceAviso) {
      const candidata = lineas
        .map(limpiar)
        .find((l) => l.length > 0 && l.length <= 60 && !l.includes(":") && /\p{L}{3,}/u.test(l));
      if (candidata) {
        const sinPrecio = candidata.replace(/\s*[-–|]\s*\$?\s*\d[\d.,]*.*$/, "").trim();
        if (sinPrecio) {
          modelo = sinPrecio;
          notas.push("el modelo se tomó de la primera línea del aviso");
        }
      }
    }
  }

  if (precio.nota) notas.push(precio.nota);

  const codigoTexto = leerEtiquetado(lineas, ["codigo", "código", "referencia", "ref"]);
  const codigo = (codigoTexto ?? texto).match(/\b[A-Z]{2,4}-?\d{2,4}\b/)?.[0] ?? null;

  const colores = leerColores(texto);
  const marca = leerMarca(texto, marcasConocidas);

  const faltantes: string[] = [];
  if (!modelo) faltantes.push("modelo");
  if (precio.valor === null) faltantes.push("precio");
  if (tallas.length === 0) faltantes.push("tallas");
  if (!marca) faltantes.push("marca");

  const seguros = [modelo !== null, precio.valor !== null, tallas.length > 0].filter(Boolean).length;
  const confianza: Confianza = seguros === 3 ? "alta" : seguros === 2 ? "media" : "baja";

  return {
    modelo,
    marca,
    codigo,
    precio: precio.valor,
    precioDudoso: precio.dudoso,
    tallas,
    colores,
    notas,
    faltantes,
    confianza,
  };
}
