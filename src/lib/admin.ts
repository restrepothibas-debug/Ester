/**
 * Consultas del panel. Todo pasa por RLS con rol administrador: si la sesión no
 * es de administrador, estas consultas devuelven vacío o error, nunca datos.
 */

import { supabase } from "./supabase";
import type { EstadoProducto } from "../types/domain";

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
  etiqueta: string;
  existencias: number;
  precioNormal: number;
  estado: EstadoProducto;
  tallas: { talla: string; cantidad: number }[];
}

/** Lista compacta para selectores del panel. */
export async function opcionesProductos(): Promise<OpcionProducto[]> {
  const { data, error } = await cliente()
    .from("productos")
    .select(
      "id, codigo_interno, modelo, precio_normal, estado, marcas ( nombre ), producto_tallas ( talla, cantidad )",
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
      etiqueta: `${p.codigo_interno} · ${p.modelo}${marca ? ` (${marca})` : ""}`,
      existencias: tallas.reduce((s, t) => s + t.cantidad, 0),
      precioNormal: Number(p.precio_normal),
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
  referencia: string;
  talla: string;
  precio: number;
  estado: "pendiente" | "confirmada" | "cancelada";
  cliente: string;
  telefono: string;
  creado: string;
}

export async function listarSolicitudesAdmin(): Promise<FilaSolicitudAdmin[]> {
  const { data, error } = await cliente()
    .from("solicitudes")
    .select(
      "id, referencia_snapshot, talla, precio_snapshot, estado, cliente_nombre, cliente_telefono, creado_en",
    )
    .order("creado_en", { ascending: false })
    .limit(100);

  if (error) throw error;

  return (data ?? []).map((s) => ({
    id: s.id,
    referencia: s.referencia_snapshot,
    talla: s.talla,
    precio: s.precio_snapshot,
    estado: s.estado,
    cliente: s.cliente_nombre,
    telefono: s.cliente_telefono,
    creado: s.creado_en,
  }));
}
