/**
 * Autenticación del panel.
 *
 * La cuenta la crea el propietario a mano en Supabase (Authentication → Users).
 * No hay registro público (§10). La contraseña la gestiona Supabase Auth: aquí
 * no se guarda ni se toca.
 *
 * Un usuario autenticado no es automáticamente administrador: la autorización
 * real vive en `public.perfiles` y en las políticas RLS. Esta capa solo decide
 * qué mostrar; si faltara, la base seguiría negando las escrituras.
 */

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export interface EstadoSesion {
  cargando: boolean;
  sesion: Session | null;
  admin: boolean;
  error: Error | null;
}

async function consultarPerfil(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase
    .from("perfiles")
    .select("rol, activo")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data?.rol === "administrador" && data?.activo === true;
}

export async function iniciarSesion(correo: string, contrasena: string): Promise<void> {
  if (!supabase) throw new Error("Supabase no está configurado.");
  const { error } = await supabase.auth.signInWithPassword({
    email: correo.trim(),
    password: contrasena,
  });
  if (error) throw error;
}

export async function cerrarSesion(): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** Sesión + comprobación de perfil, con actualización al iniciar o cerrar sesión. */
export function useSesionAdmin(): EstadoSesion {
  const [estado, setEstado] = useState<EstadoSesion>({
    cargando: true,
    sesion: null,
    admin: false,
    error: null,
  });

  useEffect(() => {
    if (!supabase) {
      setEstado({ cargando: false, sesion: null, admin: false, error: null });
      return;
    }

    let vigente = true;

    async function aplicar(sesion: Session | null) {
      if (!vigente) return;
      if (!sesion) {
        setEstado({ cargando: false, sesion: null, admin: false, error: null });
        return;
      }
      try {
        const admin = await consultarPerfil(sesion.user.id);
        if (vigente) setEstado({ cargando: false, sesion, admin, error: null });
      } catch (error) {
        if (vigente) {
          setEstado({
            cargando: false,
            sesion,
            admin: false,
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      }
    }

    supabase.auth.getSession().then(({ data }) => aplicar(data.session));

    const { data: escucha } = supabase.auth.onAuthStateChange((_evento, sesion) => {
      void aplicar(sesion);
    });

    return () => {
      vigente = false;
      escucha.subscription.unsubscribe();
    };
  }, []);

  return estado;
}
