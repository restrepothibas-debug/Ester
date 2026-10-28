/**
 * Consultas del panel. Todo pasa por RLS con rol administrador: si la sesión no
 * es de administrador, estas consultas devuelven vacío o error, nunca datos.
 */

import { supabase } from "./supabase";
import type { EstadoProducto, EstadoSolicitud } from "../types/domain";

function cliente() {
  if (!supabase) throw new Error("Supabase no está configurado.");
  return supabase;
}

const CONTAR = { count: "exact", head: true } as const;

function exigir(resultado: { count: number | null; error: { message: string } | null }): number {
  if (resultado.error) throw new Error(resultado.error.message);
  return resultado.count ?? 0;
}

export interface ResumenPanel {
  productos: number;
  agotados: number;
  pendientes: number;
  ofertasActivas: number;
  destacados: number;
  solicitudesPendientes: number;
}

/** §10 — cifras del dashboard. */
export async function resumenPanel(): Promise<ResumenPanel> {
  const ahora = new Date().toISOString();
  const db = cliente();

  const [productos, agotados, pendientes, destacados, solicitudesPendientes, ofertasActivas] =
    await Promise.all([
      db.from("productos").select("*", CONTAR),
      db.from("productos").select("*", CONTAR).eq("estado", "agotado"),
      db.from("productos").select("*", CONTAR).eq("estado", "pendiente_revision"),
      db.from("selecciones").select("*", CONTAR).eq("tipo", "destacado").eq("activo", true),
      db.from("solicitudes").select("*", CONTAR).eq("estado", "pendiente"),
      db
        .from("promociones")
        .select("*", CONTAR)
        .eq("activa", true)
        .lte("inicia_en", ahora)
        .or(`termina_en.is.null,termina_en.gt.${ahora}`),
    ]);

  return {
    productos: exigir(productos),
    agotados: exigir(agotados),
    pendientes: exigir(pendientes),
    ofertasActivas: exigir(ofertasActivas),
    destacados: exigir(destacados),
    solicitudesPendientes: exigir(solicitudesPendientes),
  };
}

export interface FilaProductoAdmin {
  id: string;
  codigoInterno: string;
  modelo: string;
  marca: string;
  estado: EstadoProducto;
  precioNormal: number;
  slug: string;
  existencias: number;
  tallas: number;
  imagenes: number;
}

export async function listarProductosAdmin(
  estado?: EstadoProducto | "todos",
): Promise<FilaProductoAdmin[]> {
  let consulta = cliente()
    .from("productos")
    .select(
      `id, codigo_interno, modelo, estado, precio_normal, slug,
       marcas ( nombre ),
       producto_tallas ( cantidad ),
       producto_imagenes ( id )`,
    )
    .order("actualizado_en", { ascending: false })
    .limit(200);

  if (estado && estado !== "todos") consulta = consulta.eq("estado", estado);

  const { data, error } = await consulta;
  if (error) throw error;

  return (data ?? []).map((fila) => {
    const tallas = (fila.producto_tallas ?? []) as { cantidad: number }[];
    return {
      id: fila.id,
      codigoInterno: fila.codigo_interno,
      modelo: fila.modelo,
      marca: (fila.marcas as unknown as { nombre: string } | null)?.nombre ?? "—",
      estado: fila.estado as EstadoProducto,
      precioNormal: fila.precio_normal,
      slug: fila.slug,
      existencias: tallas.reduce((suma, t) => suma + t.cantidad, 0),
      tallas: tallas.length,
      imagenes: ((fila.producto_imagenes ?? []) as unknown[]).length,
    };
  });
}

export interface MarcaAdmin {
  id: string;
  nombre: string;
  slug: string;
  activa: boolean;
  productos: number;
}

/** Marcas para el panel: incluye las inactivas, que el público no ve. */
export async function listarMarcasAdmin(): Promise<MarcaAdmin[]> {
  const { data, error } = await cliente()
    .from("marcas")
    .select("id, nombre, nombre_normalizado, activa, productos ( id )")
    .order("nombre", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((m) => ({
    id: m.id,
    nombre: m.nombre,
    slug: m.nombre_normalizado,
    activa: m.activa,
    productos: ((m.productos ?? []) as unknown[]).length,
  }));
}

export interface OpcionProducto {
  id: string;
  codigo: string;
  etiqueta: string;
  existencias: number;
  precioNormal: number;
  /** Lo que pagaría hoy el cliente: el de la promoción vigente si la hay. */
  precioVigente: number;
  estado: EstadoProducto;
  tallas: { talla: string; cantidad: number }[];
}

/** El precio que rige hoy: el de la promoción vigente, si la hay y rebaja. */
function precioEnVigor(p: {
  precio_normal: number;
  promociones?: { precio_promocional: number; inicia_en: string; termina_en: string | null; activa: boolean }[];
}): number {
  const ahora = Date.now();
  const promo = (p.promociones ?? []).find(
    (x) =>
      x.activa &&
      new Date(x.inicia_en).getTime() <= ahora &&
      (!x.termina_en || new Date(x.termina_en).getTime() > ahora),
  );
  const normal = Number(p.precio_normal);
  return promo && promo.precio_promocional < normal ? Number(promo.precio_promocional) : normal;
}

/** Lista compacta para selectores del panel. */
export async function opcionesProductos(): Promise<OpcionProducto[]> {
  const { data, error } = await cliente()
    .from("productos")
    .select(
      `id, codigo_interno, modelo, precio_normal, estado, marcas ( nombre ),
       producto_tallas ( talla, cantidad ),
       promociones ( precio_promocional, inicia_en, termina_en, activa )`,
    )
    .order("modelo", { ascending: true })
    .limit(300);

  if (error) throw error;

  return (data ?? []).map((p) => {
    const tallas = ((p.producto_tallas ?? []) as { talla: string; cantidad: number }[]).sort(
      (a, b) => Number(a.talla) - Number(b.talla),
    );
    const marca = (p.marcas as unknown as { nombre: string } | null)?.nombre;
    return {
      id: p.id,
      codigo: p.codigo_interno,
      etiqueta: `${p.codigo_interno} · ${p.modelo}${marca ? ` (${marca})` : ""}`,
      existencias: tallas.reduce((s, t) => s + t.cantidad, 0),
      precioNormal: Number(p.precio_normal),
      precioVigente: precioEnVigor(p),
      estado: p.estado as EstadoProducto,
      tallas,
    };
  });
}

export type TipoSeleccion = "destacado" | "oferta_semana";

export interface FilaSeleccionAdmin {
  id: string;
  productoId: string;
  producto: string;
  estado: EstadoProducto;
  orden: number;
}

/** Punto 54 — destacados y oferta de la semana se eligen a mano, no por fórmula. */
export async function listarSeleccionesAdmin(tipo: TipoSeleccion): Promise<FilaSeleccionAdmin[]> {
  const { data, error } = await cliente()
    .from("selecciones")
    .select(
      `id, producto_id, orden,
       productos ( codigo_interno, modelo, estado, marcas ( nombre ) )`,
    )
    .eq("tipo", tipo)
    .eq("activo", true)
    .order("orden", { ascending: true })
    .order("id", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((fila) => {
    const producto = fila.productos as unknown as {
      codigo_interno: string;
      modelo: string;
      estado: EstadoProducto;
      marcas: { nombre: string } | null;
    } | null;
    const marca = producto?.marcas?.nombre;
    return {
      id: fila.id,
      productoId: fila.producto_id,
      producto: producto
        ? `${producto.codigo_interno} · ${producto.modelo}${marca ? ` (${marca})` : ""}`
        : "Producto eliminado",
      estado: (producto?.estado ?? "archivado") as EstadoProducto,
      orden: fila.orden,
    };
  });
}

export type EstadoPromocion = "programada" | "vigente" | "vencida" | "terminada";

export interface FilaPromocionAdmin {
  id: string;
  productoId: string;
  producto: string;
  precioNormal: number;
  precioPromocional: number;
  tipo: "manual" | "programada";
  iniciaEn: string;
  terminaEn: string | null;
  activa: boolean;
  estado: EstadoPromocion;
}

/**
 * Estado de una promoción, sin depender del reloj del servidor de turno.
 * «Terminada» es la que el administrador apagó; «vencida», la que llegó a su
 * fecha final. Ninguna se borra (punto 45, Listón E4).
 */
export function estadoPromocion(p: {
  activa: boolean;
  iniciaEn: string;
  terminaEn: string | null;
}): EstadoPromocion {
  if (!p.activa) return "terminada";
  const ahora = Date.now();
  if (new Date(p.iniciaEn).getTime() > ahora) return "programada";
  if (p.terminaEn && new Date(p.terminaEn).getTime() <= ahora) return "vencida";
  return "vigente";
}

/** Promociones para el panel: las vigentes, las programadas y el historial. */
export async function listarPromocionesAdmin(): Promise<FilaPromocionAdmin[]> {
  const { data, error } = await cliente()
    .from("promociones")
    .select(
      `id, producto_id, precio_promocional, tipo, inicia_en, termina_en, activa,
       productos ( codigo_interno, modelo, precio_normal, marcas ( nombre ) )`,
    )
    .order("inicia_en", { ascending: false })
    .limit(200);

  if (error) throw error;

  return (data ?? []).map((p) => {
    const producto = p.productos as unknown as {
      codigo_interno: string;
      modelo: string;
      precio_normal: number;
      marcas: { nombre: string } | null;
    } | null;
    const marca = producto?.marcas?.nombre;
    const base = {
      activa: p.activa,
      iniciaEn: p.inicia_en,
      terminaEn: p.termina_en,
    };
    return {
      id: p.id,
      productoId: p.producto_id,
      producto: producto
        ? `${producto.codigo_interno} · ${producto.modelo}${marca ? ` (${marca})` : ""}`
        : "Producto eliminado",
      precioNormal: Number(producto?.precio_normal ?? 0),
      precioPromocional: Number(p.precio_promocional),
      tipo: p.tipo as "manual" | "programada",
      iniciaEn: p.inicia_en,
      terminaEn: p.termina_en,
      activa: p.activa,
      estado: estadoPromocion(base),
    };
  });
}

export interface FilaSolicitudAdmin {
  id: string;
  productoId: string | null;
  producto: string;
  referencia: string;
  talla: string;
  precio: number;
  estado: EstadoSolicitud;
  cliente: string;
  telefono: string;
  observaciones: string | null;
  motivoCancelacion: string | null;
  inventarioDescontado: boolean;
  creado: string;
  confirmadaEn: string | null;
  /** Unidades que hay hoy en esa talla. Sirve para decidir antes de confirmar. */
  existencias: number;
}

/**
 * Punto 57 — las solicitudes se registran a mano y se conservan hasta que el
 * administrador las borre (punto 59). Se leen con el estado actual del stock
 * para poder avisar antes de descontar (punto 61).
 */
export async function listarSolicitudesAdmin(
  estado?: EstadoSolicitud | "todas",
): Promise<FilaSolicitudAdmin[]> {
  let consulta = cliente()
    .from("solicitudes")
    .select(
      `id, producto_id, referencia_snapshot, talla, precio_snapshot, estado,
       cliente_nombre, cliente_telefono, observaciones, motivo_cancelacion,
       inventario_descontado, creado_en, confirmada_en,
       productos ( codigo_interno, modelo, producto_tallas ( talla, cantidad ) )`,
    )
    .order("creado_en", { ascending: false })
    .limit(200);

  if (estado && estado !== "todas") consulta = consulta.eq("estado", estado);

  const { data, error } = await consulta;
  if (error) throw error;

  return (data ?? []).map((s) => {
    const producto = s.productos as unknown as {
      codigo_interno: string;
      modelo: string;
      producto_tallas: { talla: string; cantidad: number }[];
    } | null;
    const existencias =
      producto?.producto_tallas?.find((t) => t.talla === s.talla)?.cantidad ?? 0;

    return {
      id: s.id,
      productoId: s.producto_id,
      producto: producto ? `${producto.codigo_interno} · ${producto.modelo}` : "Producto eliminado",
      referencia: s.referencia_snapshot,
      talla: s.talla,
      precio: Number(s.precio_snapshot),
      estado: s.estado as EstadoSolicitud,
      cliente: s.cliente_nombre,
      telefono: s.cliente_telefono,
      observaciones: s.observaciones,
      motivoCancelacion: s.motivo_cancelacion,
      inventarioDescontado: s.inventario_descontado,
      creado: s.creado_en,
      confirmadaEn: s.confirmada_en,
      existencias,
    };
  });
}

