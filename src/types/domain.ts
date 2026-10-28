/**
 * Tipos del dominio derivados de la especificación (§6 campos y estados, §14 entidades).
 * No añadir campos que la especificación no defina: cualquier campo nuevo es una
 * decisión del propietario, no del código.
 */

/** §6 — Estados del producto */
export type EstadoProducto =
  | "pendiente_revision"
  | "borrador"
  | "publicado"
  | "agotado"
  | "archivado";

export const ETIQUETA_ESTADO: Record<EstadoProducto, string> = {
  pendiente_revision: "Pendiente de revisión",
  borrador: "Borrador",
  publicado: "Publicado",
  agotado: "Agotado",
  archivado: "Archivado",
};

/** §6 — Tallas y cantidades: inventario por talla con cantidad exacta */
export interface TallaInventario {
  talla: string;
  cantidad: number;
}

/** §6 — Ficha de producto */
export interface Producto {
  id: string;
  codigoInterno: string;
  marcaId: string;
  modelo: string;
  color: string | null;
  precioNormal: number;
  precioPromocional: number | null;
  imagenes: ImagenProducto[];
  tallas: TallaInventario[];
  estado: EstadoProducto;
}

/** §6 / §11 — Fotografías: una principal obligatoria, adicionales con orden editable */
export interface ImagenProducto {
  id: string;
  ruta: string;
  principal: boolean;
  orden: number;
}

/** §14 — Marcas */
export interface Marca {
  id: string;
  nombre: string;
  logoRuta: string | null;
  activa: boolean;
}

/** §8 — Registro manual de solicitudes de WhatsApp */
export type EstadoSolicitud = "pendiente" | "confirmada" | "cancelada";

export const ETIQUETA_SOLICITUD: Record<EstadoSolicitud, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
};
