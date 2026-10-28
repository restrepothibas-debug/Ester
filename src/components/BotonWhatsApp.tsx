import { enlaceWhatsApp, whatsappConfigurado } from "../lib/whatsapp";
import { formatearPrecio } from "../lib/formato";
import type { ProductoVista } from "../types/domain";

interface Props {
  producto: ProductoVista;
  talla: string | null;
}

/**
 * §8 — prepara el mensaje y abre WhatsApp.
 * Si falta el número o la talla, no se inventa un enlace: se explica qué falta.
 */
export function BotonWhatsApp({ producto, talla }: Props) {
  if (!whatsappConfigurado) {
    return (
      <p className="rt-nota-pendiente">
        El número de WhatsApp aún no está configurado. Es un dato pendiente del propietario.
      </p>
    );
  }

  if (!talla) {
    return <p className="rt-nota-pendiente">Elige una talla disponible para continuar.</p>;
  }

  const enlace = enlaceWhatsApp({
    marca: producto.marca,
    modelo: producto.modelo,
    referencia: producto.referencia,
    talla,
    precio: formatearPrecio(producto.precioVigente),
  });

  return (
    <a className="rt-boton rt-boton--primario" href={enlace ?? "#"} target="_blank" rel="noreferrer">
      Consultar por WhatsApp · talla {talla}
    </a>
  );
}
