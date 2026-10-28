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
  tallas: { talla: string; cantidad: number }[];
}

/** Lista compacta para selectores del panel. */
export async function opcionesProductos(): Promise<OpcionProducto[]> {
  const { data, error } = await cliente()
    .from("productos")
    .select("id, codigo_interno, modelo, marcas ( nombre ), producto_tallas ( talla, cantidad )")
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
      tallas,
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
