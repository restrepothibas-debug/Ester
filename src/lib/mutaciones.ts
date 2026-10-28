/**
 * Escrituras del panel.
 *
 * Toda operación pasa por RLS con rol administrador. Aquí se añaden las reglas
 * que la base no puede expresar sola: registrar el historial antes de cambiar
 * un dato, no tocar cantidades en silencio y dejar rastro en auditoría (§7, §9, §15).
 */

import { supabase } from "./supabase";
import type { EstadoProducto } from "../types/domain";

function cliente() {
  if (!supabase) throw new Error("Supabase no está configurado.");
  return supabase;
}

async function usuarioActual(): Promise<string | null> {
  const { data } = await cliente().auth.getUser();
  return data.user?.id ?? null;
}

/** §15 — rastro de acciones sensibles. Nunca guarda datos personales. */
async function auditar(
  accion: string,
  entidad: string,
  entidadId: string | null,
  datos?: Record<string, unknown>,
): Promise<void> {
  const actor = await usuarioActual();
  await cliente()
    .from("auditoria")
    .insert({ actor_id: actor, accion, entidad, entidad_id: entidadId, datos: datos ?? null });
}

/* -------------------------------------------------------------------------- */
/* Marcas                                                                      */
/* -------------------------------------------------------------------------- */

export interface EntradaMarca {
  nombre: string;
  activa: boolean;
}

export async function crearMarca(entrada: EntradaMarca): Promise<void> {
  const { data, error } = await cliente()
    .from("marcas")
    .insert({ nombre: entrada.nombre.trim(), activa: entrada.activa })
    .select("id")
    .single();

  if (error) throw new Error(traducir(error.message));
  await auditar("marca.creada", "marcas", data.id, { nombre: entrada.nombre });
}

export async function actualizarMarca(id: string, entrada: EntradaMarca): Promise<void> {
  const { error } = await cliente()
    .from("marcas")
    .update({ nombre: entrada.nombre.trim(), activa: entrada.activa })
    .eq("id", id);

  if (error) throw new Error(traducir(error.message));
  await auditar("marca.actualizada", "marcas", id, { nombre: entrada.nombre, activa: entrada.activa });
}

/* -------------------------------------------------------------------------- */
/* Productos                                                                   */
/* -------------------------------------------------------------------------- */

export interface EntradaProducto {
  codigoInterno: string;
  marcaId: string;
  modelo: string;
  referencia: string | null;
  color: string | null;
  precioNormal: number;
  estado: EstadoProducto;
  tallas: { talla: string; cantidad: number }[];
}

export async function crearProducto(entrada: EntradaProducto): Promise<{ id: string; slug: string }> {
  const db = cliente();

  const { data, error } = await db
    .from("productos")
    .insert({
      codigo_interno: entrada.codigoInterno.trim(),
      marca_id: entrada.marcaId,
      modelo: entrada.modelo.trim(),
      referencia: entrada.referencia?.trim() || null,
      color: entrada.color?.trim() || null,
      precio_normal: entrada.precioNormal,
      estado: entrada.estado,
      publicado_en: entrada.estado === "publicado" ? new Date().toISOString() : null,
    })
    .select("id, slug")
    .single();

  if (error) throw new Error(traducir(error.message));

  const tallas = entrada.tallas.filter((t) => t.cantidad >= 0);
  if (tallas.length > 0) {
    const { error: errorTallas } = await db
      .from("producto_tallas")
      .insert(tallas.map((t) => ({ producto_id: data.id, talla: t.talla, cantidad: t.cantidad })));

    if (errorTallas) throw new Error(traducir(errorTallas.message));

    const conStock = tallas.filter((t) => t.cantidad > 0);
    if (conStock.length > 0) {
      const actor = await usuarioActual();
      await db.from("movimientos_inventario").insert(
        conStock.map((t) => ({
          producto_id: data.id,
          talla: t.talla,
          cantidad_anterior: 0,
          cantidad_nueva: t.cantidad,
          tipo: "entrada" as const,
          motivo: "Carga inicial del producto",
          responsable_id: actor,
        })),
      );
    }
  }

  await auditar("producto.creado", "productos", data.id, {
    codigo: entrada.codigoInterno,
    estado: entrada.estado,
  });

  return { id: data.id, slug: data.slug };
}

export async function obtenerProductoParaEditar(id: string) {
  const { data, error } = await cliente()
    .from("productos")
    .select(
      `id, codigo_interno, marca_id, modelo, referencia, color, precio_normal, estado, slug,
       producto_tallas ( talla, cantidad )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(traducir(error.message));
  if (!data) return null;

  return {
    id: data.id,
    codigoInterno: data.codigo_interno,
    marcaId: data.marca_id,
    modelo: data.modelo,
    referencia: data.referencia,
    color: data.color,
    precioNormal: data.precio_normal,
    estado: data.estado as EstadoProducto,
    slug: data.slug,
    tallas: ((data.producto_tallas ?? []) as { talla: string; cantidad: number }[]).sort(
      (a, b) => Number(a.talla) - Number(b.talla),
    ),
  };
}

/**
 * Actualiza datos, precio y tallas.
 * El precio no se guarda sin dejar historial; la cantidad no cambia sin movimiento.
 */
export async function actualizarProducto(id: string, entrada: EntradaProducto): Promise<void> {
  const db = cliente();
  const anterior = await obtenerProductoParaEditar(id);
  if (!anterior) throw new Error("El producto ya no existe.");

  const cambiaPrecio = Number(anterior.precioNormal) !== Number(entrada.precioNormal);

  const { error } = await db
    .from("productos")
    .update({
      codigo_interno: entrada.codigoInterno.trim(),
      marca_id: entrada.marcaId,
      modelo: entrada.modelo.trim(),
      referencia: entrada.referencia?.trim() || null,
      color: entrada.color?.trim() || null,
      precio_normal: entrada.precioNormal,
      estado: entrada.estado,
      publicado_en:
        entrada.estado === "publicado" && anterior.estado !== "publicado"
          ? new Date().toISOString()
          : undefined,
    })
    .eq("id", id);

  if (error) throw new Error(traducir(error.message));

  if (cambiaPrecio) {
    const actor = await usuarioActual();
    const { error: errorPrecio } = await db.from("historial_precios").insert({
      producto_id: id,
      campo: "normal",
      valor_anterior: anterior.precioNormal,
      valor_nuevo: entrada.precioNormal,
      responsable_id: actor,
    });
    if (errorPrecio) throw new Error(traducir(errorPrecio.message));
    await auditar("precio.editado", "productos", id, {
      anterior: anterior.precioNormal,
      nuevo: entrada.precioNormal,
    });
  }

  await sincronizarTallas(id, anterior.tallas, entrada.tallas);
  await auditar("producto.actualizado", "productos", id, { estado: entrada.estado });
}

/** Compara tallas y registra un movimiento por cada cambio real de cantidad. */
async function sincronizarTallas(
  productoId: string,
  anteriores: { talla: string; cantidad: number }[],
  nuevas: { talla: string; cantidad: number }[],
): Promise<void> {
  const db = cliente();
  const actor = await usuarioActual();
  const mapaAnterior = new Map(anteriores.map((t) => [t.talla, t.cantidad]));

  for (const nueva of nuevas) {
    const previa = mapaAnterior.get(nueva.talla);
    if (previa === nueva.cantidad) continue;

    const { error } = await db
      .from("producto_tallas")
      .upsert(
        { producto_id: productoId, talla: nueva.talla, cantidad: nueva.cantidad },
        { onConflict: "producto_id,talla" },
      );
    if (error) throw new Error(traducir(error.message));

    const delta = nueva.cantidad - (previa ?? 0);
    await db.from("movimientos_inventario").insert({
      producto_id: productoId,
      talla: nueva.talla,
      cantidad_anterior: previa ?? 0,
      cantidad_nueva: nueva.cantidad,
      tipo: delta > 0 ? "entrada" : "ajuste",
      motivo: previa === undefined ? "Talla añadida" : "Ajuste desde el formulario de producto",
      responsable_id: actor,
    });
  }
}

/* -------------------------------------------------------------------------- */
/* Inventario                                                                  */
/* -------------------------------------------------------------------------- */

export type TipoMovimiento = "entrada" | "venta" | "ajuste" | "devolucion";

export async function ajustarInventario(params: {
  productoId: string;
  talla: string;
  cantidadAnterior: number;
  cantidadNueva: number;
  tipo: TipoMovimiento;
  motivo: string;
}): Promise<void> {
  const db = cliente();

  if (params.cantidadNueva < 0) throw new Error("La cantidad no puede ser negativa.");
  if (params.tipo === "ajuste" && !params.motivo.trim()) {
    throw new Error("Un ajuste necesita motivo.");
  }

  const { error } = await db
    .from("producto_tallas")
    .upsert(
      { producto_id: params.productoId, talla: params.talla, cantidad: params.cantidadNueva },
      { onConflict: "producto_id,talla" },
    );
  if (error) throw new Error(traducir(error.message));

  const actor = await usuarioActual();
  const { error: errorMovimiento } = await db.from("movimientos_inventario").insert({
    producto_id: params.productoId,
    talla: params.talla,
    cantidad_anterior: params.cantidadAnterior,
    cantidad_nueva: params.cantidadNueva,
    tipo: params.tipo,
    motivo: params.motivo.trim() || null,
    responsable_id: actor,
  });
  if (errorMovimiento) throw new Error(traducir(errorMovimiento.message));

  await auditar("inventario.ajustado", "producto_tallas", params.productoId, {
    talla: params.talla,
    anterior: params.cantidadAnterior,
    nuevo: params.cantidadNueva,
    tipo: params.tipo,
  });
}

export interface MovimientoVista {
  id: string;
  talla: string;
  cantidadAnterior: number;
  cantidadNueva: number;
  tipo: TipoMovimiento;
  motivo: string | null;
  creado: string;
}

export async function listarMovimientos(productoId: string): Promise<MovimientoVista[]> {
  const { data, error } = await cliente()
    .from("movimientos_inventario")
    .select("id, talla, cantidad_anterior, cantidad_nueva, tipo, motivo, creado_en")
    .eq("producto_id", productoId)
    .order("creado_en", { ascending: false })
    .limit(50);

  if (error) throw new Error(traducir(error.message));

  return (data ?? []).map((m) => ({
    id: m.id,
    talla: m.talla,
    cantidadAnterior: m.cantidad_anterior,
    cantidadNueva: m.cantidad_nueva,
    tipo: m.tipo as TipoMovimiento,
    motivo: m.motivo,
    creado: m.creado_en,
  }));
}

/** Mensajes de PostgreSQL traducidos a algo que el administrador entienda. */
function traducir(mensaje: string): string {
  if (/duplicate key.*codigo_interno/i.test(mensaje)) return "Ese código interno ya existe.";
  if (/duplicate key.*slug/i.test(mensaje)) return "Ya hay un producto con ese modelo y código.";
  if (/duplicate key.*nombre_normalizado/i.test(mensaje)) return "Ya existe una marca con ese nombre.";
  if (/violates check constraint/i.test(mensaje)) return "Algún dato no cumple las reglas del formulario.";
  if (/row-level security/i.test(mensaje)) return "Tu cuenta no tiene permisos para esta operación.";
  return mensaje;
}
