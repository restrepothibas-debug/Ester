/**
 * §8 — Mensaje prellenado para WhatsApp.
 *
 * Abrir WhatsApp NO crea solicitud, NO descuenta inventario y NO registra la
 * conversación. El registro es manual, desde el panel, y esa decisión no se
 * puede tomar desde aquí.
 */

const numero = (import.meta.env.VITE_WHATSAPP_NUMERO as string | undefined)?.trim();

export const whatsappConfigurado = Boolean(numero);

export interface DatosSolicitud {
  marca: string;
  modelo: string;
  referencia: string | null;
  talla: string;
  precio: string;
}

export function enlaceWhatsApp(datos: DatosSolicitud): string | null {
  if (!numero) return null;

  const lineas = [
    "Hola, quiero consultar por este producto:",
    "",
    `Producto: ${datos.marca} · ${datos.modelo}`,
    datos.referencia ? `Referencia: ${datos.referencia}` : null,
    `Talla: ${datos.talla}`,
    `Precio: ${datos.precio}`,
  ].filter(Boolean);

  return `https://wa.me/${numero}?text=${encodeURIComponent(lineas.join("\n"))}`;
}
