import { useEffect, useState } from "react";

interface Estado<T> {
  cargando: boolean;
  datos: T | null;
  error: Error | null;
}

/**
 * Ejecuta una consulta y expone cargando / datos / error.
 * Ignora respuestas de ejecuciones anteriores cuando los parámetros cambian.
 */
export function useConsulta<T>(fn: () => Promise<T>, deps: unknown[]): Estado<T> {
  const [estado, setEstado] = useState<Estado<T>>({
    cargando: true,
    datos: null,
    error: null,
  });

  useEffect(() => {
    let vigente = true;
    setEstado({ cargando: true, datos: null, error: null });

    fn()
      .then((datos) => {
        if (vigente) setEstado({ cargando: false, datos, error: null });
      })
      .catch((error: unknown) => {
        if (vigente) {
          setEstado({
            cargando: false,
            datos: null,
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      });

    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return estado;
}
