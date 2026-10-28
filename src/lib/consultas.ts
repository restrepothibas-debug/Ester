/**
 * Acceso a datos del catálogo público.
 *
 * Todo lo que se lee aquí pasa por RLS: la base ya limita lo que un visitante
 * anónimo puede ver (productos publicados o agotados, marcas activas, tallas con
 * existencias, promociones vigentes). Este archivo no filtra seguridad: filtra
 * presentación.
 */

import { supabase } from "./supabase";
import type {
  FiltrosCatalogo,
  ProductoCatalogo,
  ProductoVista,
  Marca,
} from "../types/domain";

export const POR_PAGINA = 12;

export class ErrorSinConfigurar extends Error {
  constructor() {
    super("Supabase no está configurado: faltan variables de entorno.");
    this.name = "ErrorSinConfigurar";
  }
}

function cliente() {
  if (!supabase) throw new ErrorSinConfigurar();
  return supabase;
}

const CAMPOS = `
  id, codigo_interno, modelo, referencia, color, precio_normal, estado, slug,
  marcas ( nombre, nombre_normalizado ),
  producto_imagenes ( ruta, principal, orden ),
  producto_tallas ( talla, cantidad ),
  promociones ( precio_promocional, inicia_en, termina_en, activa, tipo )
`;

/** Precio vigente: el de la promoción activa si existe, si no el normal (§9). */
function precioVigente(fila: ProductoCatalogo): { valor: number; enPromocion: boolean } {
  const promo = fila.promociones?.[0];
  if (promo && promo.precio_promocional < fila.precio_normal) {
    return { valor: promo.precio_promocional, enPromocion: true };
  }
  return { valor: fila.precio_normal, enPromocion: false };
}

function normalizar(fila: ProductoCatalogo): ProductoVista {
  const imagenes = [...(fila.producto_imagenes ?? [])].sort((a, b) => {
    if (a.principal !== b.principal) return a.principal ? -1 : 1;
    return a.orden - b.orden;
  });
  const tallas = [...(fila.producto_tallas ?? [])].sort(
    (a, b) => Number(a.talla) - Number(b.talla),
  );
  const { valor, enPromocion } = precioVigente(fila);

  return {
    id: fila.id,
    slug: fila.slug,
    codigoInterno: fila.codigo_interno,
    marca: fila.marcas?.nombre ?? "Sin marca",
    marcaSlug: fila.marcas?.nombre_normalizado ?? "",
    modelo: fila.modelo,
    referencia: fila.referencia,
    color: fila.color,
    precioNormal: fila.precio_normal,
    precioVigente: valor,
    enPromocion,
    estado: fila.estado,
    imagenPrincipal: imagenes[0]?.ruta ?? null,
    imagenes: imagenes.map((i) => i.ruta),
    tallas,
    agotado: fila.estado === "agotado" || tallas.length === 0,
  };
}

/** Marca por slug (`nombre_normalizado`) para la ruta `/marca/:slug`. */
export async function obtenerMarca(slug: string): Promise<Marca | null> {
  const { data, error } = await cliente()
    .from("marcas")
    .select("id, nombre, nombre_normalizado, logo_ruta, activa")
    .eq("nombre_normalizado", slug)
    .eq("activa", true)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    nombre: data.nombre,
    slug: data.nombre_normalizado,
    logoRuta: data.logo_ruta,
    activa: data.activa,
  };
}

/** §14 — marcas activas, para la cuadrícula de logotipos. */
export async function listarMarcas(): Promise<Marca[]> {
  const { data, error } = await cliente()
    .from("marcas")
    .select("id, nombre, nombre_normalizado, logo_ruta, activa")
    .eq("activa", true)
    .order("nombre", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((m) => ({
    id: m.id,
    nombre: m.nombre,
    slug: m.nombre_normalizado,
    logoRuta: m.logo_ruta,
    activa: m.activa,
  }));
}

/**
 * Listado del catálogo con filtros.
 * La talla exige `!inner` para filtrar productos, no solo las filas incrustadas.
 */
export async function listarProductos(filtros: FiltrosCatalogo = {}): Promise<{
  items: ProductoVista[];
  total: number;
}> {
  const pagina = Math.max(1, filtros.pagina ?? 1);
  const desde = (pagina - 1) * POR_PAGINA;
  const hasta = desde + POR_PAGINA - 1;

  const campos = filtros.talla
    ? CAMPOS.replace(
        "producto_tallas ( talla, cantidad )",
        "producto_tallas!inner ( talla, cantidad )",
      )
    : CAMPOS;

  let consulta = cliente()
    .from("productos")
    .select(campos, { count: "exact" })
    .in("estado", ["publicado", "agotado"]);

  if (filtros.marca) {
    // La URL lleva el slug de la marca, que es su `nombre_normalizado`
    // (minúsculas, sin tildes): la misma columna que evita duplicados (§11).
    const marca = await obtenerMarca(filtros.marca);
    if (!marca) return { items: [], total: 0 };
    consulta = consulta.eq("marca_id", marca.id);
  }

  if (filtros.talla) consulta = consulta.eq("producto_tallas.talla", filtros.talla);
  if (filtros.precioMax !== undefined) consulta = consulta.lte("precio_normal", filtros.precioMax);
  if (filtros.modelo) consulta = consulta.ilike("modelo", `%${filtros.modelo}%`);
  if (filtros.q) {
    const q = filtros.q.replace(/[%,()]/g, " ").trim();
    if (q) {
      consulta = consulta.or(
        [`modelo.ilike.%${q}%`, `referencia.ilike.%${q}%`, `color.ilike.%${q}%`, `codigo_interno.ilike.%${q}%`].join(","),
      );
    }
  }

  const { data, error, count } = await consulta
    .order("publicado_en", { ascending: false, nullsFirst: false })
    .order("modelo", { ascending: true })
    .range(desde, hasta);

  if (error) throw error;
  return {
    items: (data as unknown as ProductoCatalogo[]).map(normalizar),
    total: count ?? 0,
  };
}

/** §6 — ficha completa por slug. */
export async function obtenerProducto(slug: string): Promise<ProductoVista | null> {
  const { data, error } = await cliente()
    .from("productos")
    .select(CAMPOS)
    .eq("slug", slug)
    .in("estado", ["publicado", "agotado"])
    .maybeSingle();

  if (error) throw error;
  return data ? normalizar(data as unknown as ProductoCatalogo) : null;
}

/** §54 — destacados y ofertas de la semana, seleccionados a mano. */
export async function listarSeleccion(
  tipo: "destacado" | "oferta_semana",
  limite = 8,
): Promise<ProductoVista[]> {
  const { data, error } = await cliente()
    .from("selecciones")
    .select(`orden, productos ( ${CAMPOS} )`)
    .eq("tipo", tipo)
    .eq("activo", true)
    .order("orden", { ascending: true })
    .limit(limite);

  if (error) throw error;

  return (data ?? [])
    .map((fila) => fila.productos as unknown as ProductoCatalogo | null)
    .filter((p): p is ProductoCatalogo => Boolean(p))
    .map(normalizar);
}

/** §4 — sugerencias mientras se escribe: modelo, referencia y color. */
export async function sugerencias(q: string, limite = 6): Promise<ProductoVista[]> {
  const texto = q.replace(/[%,()]/g, " ").trim();
  if (texto.length < 2) return [];

  const { data, error } = await cliente()
    .from("productos")
    .select(CAMPOS)
    .in("estado", ["publicado", "agotado"])
    .or([`modelo.ilike.%${texto}%`, `referencia.ilike.%${texto}%`, `color.ilike.%${texto}%`].join(","))
    .limit(limite);

  if (error) throw error;
  return (data as unknown as ProductoCatalogo[]).map(normalizar);
}
