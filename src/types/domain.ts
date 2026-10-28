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

/** Estados que el público puede ver (§6) */
export const ESTADOS_VISIBLES: EstadoProducto[] = ["publicado", "agotado"];

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
  /** `nombre_normalizado`: la base lo calcula y es el slug de la URL pública. */
  slug: string;
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

/* -------------------------------------------------------------------------- */
/* Tipos de lectura del catálogo público                                       */
/* -------------------------------------------------------------------------- */

/** Forma que devuelve la consulta de catálogo con los recursos incrustados. */
export interface ProductoCatalogo {
  id: string;
  codigo_interno: string;
  modelo: string;
  referencia: string | null;
  color: string | null;
  precio_normal: number;
  estado: EstadoProducto;
  slug: string;
  marcas: { nombre: string; nombre_normalizado: string } | null;
  producto_imagenes: { ruta: string; ruta_min: string | null; principal: boolean; orden: number }[];
  producto_tallas: { talla: string; cantidad: number }[];
  promociones: {
    precio_promocional: number;
    inicia_en: string;
    termina_en: string | null;
    activa: boolean;
    tipo: "manual" | "programada";
  }[];
}

/** Producto ya normalizado para la interfaz. */
export interface ProductoVista {
  id: string;
  slug: string;
  codigoInterno: string;
  marca: string;
  marcaSlug: string;
  modelo: string;
  referencia: string | null;
  color: string | null;
  precioNormal: number;
  precioVigente: number;
  enPromocion: boolean;
  estado: EstadoProducto;
  imagenPrincipal: string | null;
  /** Versión de 480 px para tarjetas y listados. */
  imagenMini: string | null;
  imagenes: string[];
  tallas: TallaInventario[];
  agotado: boolean;
}

/** Filtros del catálogo, todos opcionales y viajando en la URL. */
export interface FiltrosCatalogo {
  marca?: string;
  q?: string;
  talla?: string;
  precioMax?: number;
  modelo?: string;
  pagina?: number;
}
