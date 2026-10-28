import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase.
 *
 * Se construye solo si existen las variables de entorno. Si faltan, la aplicación
 * funciona en modo sin datos en lugar de fallar: así se puede revisar el diseño
 * antes de conectar el proyecto real.
 *
 * Solo se usa la clave anónima (`anon`). La clave `service_role` nunca va al cliente
 * (especificación §15).
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigurado = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = supabaseConfigurado
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;
