/** Formato de presentación. La moneda vive en la tabla `configuracion` (D-17). */

const MONEDA = "COP";

/**
 * Precio en pesos. Sin decimales: el peso colombiano no los usa.
 * Decisión provisional D-17, revisable en `configuracion.moneda`.
 */
export function formatearPrecio(valor: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: MONEDA,
    maximumFractionDigits: 0,
  }).format(valor);
}

/** Descuento porcentual, redondeado hacia abajo para no exagerar la rebaja. */
export function calcularDescuento(normal: number, vigente: number): number | null {
  if (!normal || vigente >= normal) return null;
  return Math.floor(((normal - vigente) / normal) * 100);
}

/** Tallas ordenadas: numéricas si se puede, texto si no (D-17 orden_tallas). */
export function ordenarTallas<T extends { talla: string }>(tallas: T[]): T[] {
  return [...tallas].sort((a, b) => {
    const na = Number(a.talla);
    const nb = Number(b.talla);
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    return a.talla.localeCompare(b.talla, "es");
  });
}

/** Resumen de disponibilidad sin listar todas las tallas (§4). */
export function resumenTallas(tallas: { talla: string; cantidad: number }[]): string {
  const disponibles = ordenarTallas(tallas.filter((t) => t.cantidad > 0));
  if (disponibles.length === 0) return "Sin tallas disponibles";
  if (disponibles.length === 1) return `Talla ${disponibles[0].talla}`;
  const primera = disponibles[0].talla;
  const ultima = disponibles[disponibles.length - 1].talla;
  return `${disponibles.length} tallas · ${primera} a ${ultima}`;
}

/** Iniciales para el marcador de imagen cuando aún no hay fotografía. */
export function iniciales(texto: string): string {
  return texto
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
