/**
 * Direcciones de los archivos publicados en Supabase Storage.
 *
 * En la base se guarda la **ruta** dentro del bucket (`fotos/abc123.webp`), no la
 * URL completa: así el proyecto puede cambiar de dominio o de bucket sin tocar
 * una sola fila. La URL se construye al leer.
 */

import { supabase } from "./supabase";

export const BUCKET_PRODUCTOS = "productos";
export const CARPETA_FOTOS = "fotos";

/** URL pública de un objeto del bucket de productos. */
export function urlPublica(ruta: string | null | undefined): string | null {
  if (!ruta) return null;
  // Tolerancia con filas antiguas que ya guardaban una URL completa.
  if (/^https?:\/\//i.test(ruta)) return ruta;
  if (!supabase) return null;
  return supabase.storage.from(BUCKET_PRODUCTOS).getPublicUrl(ruta).data.publicUrl;
}
