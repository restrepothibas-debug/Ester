/**
 * Fechas del panel en la zona del negocio.
 *
 * La base guarda `timestamptz` en UTC; el propietario decide y lee en
 * America/Bogota (D-34). Bogotá no aplica horario de verano: su desfase es
 * siempre −05:00, así que la conversión es exacta y no depende del navegador.
 */

export const ZONA_NEGOCIO = "America/Bogota";
const DESFASE = "-05:00";

/**
 * `2026-11-01T23:59` (valor de un input datetime-local) → instante en UTC.
 * Se interpreta como hora de Bogotá, no como hora del equipo del administrador.
 */
export function fechaLocalABogota(valor: string): string | null {
  const limpio = valor.trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(limpio)) return null;
  const instante = new Date(`${limpio}:00${DESFASE}`);
  return Number.isNaN(instante.getTime()) ? null : instante.toISOString();
}

/** Instante ISO → `2026-11-01T23:59` en Bogotá, para rellenar el formulario. */
export function fechaBogotaAInput(iso: string | null): string {
  if (!iso) return "";
  const instante = new Date(iso);
  if (Number.isNaN(instante.getTime())) return "";
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_NEGOCIO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(instante);
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "";
  const hora = valor("hour") === "24" ? "00" : valor("hour");
  return `${valor("year")}-${valor("month")}-${valor("day")}T${hora}:${valor("minute")}`;
}

/** Texto legible: «1 nov 2026, 23:59 (Bogotá)». */
export function formatearFecha(iso: string | null): string {
  if (!iso) return "Sin fecha final";
  const instante = new Date(iso);
  if (Number.isNaN(instante.getTime())) return "Fecha inválida";
  const texto = new Intl.DateTimeFormat("es-CO", {
    timeZone: ZONA_NEGOCIO,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(instante);
  return `${texto} (Bogotá)`;
}

/**
 * Reloj del negocio en dos formas. Viven aquí para que los componentes no lean
 * el reloj durante el render: la hora se pide cuando se necesita, no en cada
 * repintado.
 */
export function ahoraISO(): string {
  return new Date().toISOString();
}

export function ahoraEnBogota(): string {
  return fechaBogotaAInput(ahoraISO());
}
