import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { listarProductos, POR_PAGINA } from "../lib/consultas";
import { useConsulta } from "../lib/useConsulta";
import { supabaseConfigurado } from "../lib/supabase";
import type { FiltrosCatalogo } from "../types/domain";
import { CuadriculaProductos } from "./CuadriculaProductos";
import { Filtros } from "./Filtros";
import { Paginacion } from "./Paginacion";

interface Props {
  marca?: string;
  q?: string;
  mensajeVacio?: string;
}

/**
 * Listado reutilizable: filtros + cuadrícula + paginación.
 * Los filtros viven en la URL (§4), así que un enlace compartido por WhatsApp
 * reproduce exactamente lo que vio el cliente.
 */
export function ListadoCatalogo({ marca, q, mensajeVacio }: Props) {
  const [params] = useSearchParams();
  const configurado = supabaseConfigurado;

  const filtros: FiltrosCatalogo = useMemo(
    () => ({
      marca,
      q,
      talla: params.get("talla") ?? undefined,
      precioMax: params.get("precioMax") ? Number(params.get("precioMax")) : undefined,
      modelo: params.get("modelo") ?? undefined,
      pagina: params.get("pagina") ? Math.max(1, Number(params.get("pagina"))) : 1,
    }),
    [marca, q, params],
  );

  const { cargando, datos, error } = useConsulta(
    () => (configurado ? listarProductos(filtros) : Promise.resolve({ items: [], total: 0 })),
    [filtros.marca, filtros.q, filtros.talla, filtros.precioMax, filtros.modelo, filtros.pagina, configurado],
  );

  const tallas = useMemo(() => {
    const conjunto = new Set<string>();
    for (const p of datos?.items ?? []) for (const t of p.tallas) conjunto.add(t.talla);
    return [...conjunto].sort((a, b) => Number(a) - Number(b));
  }, [datos]);

  return (
    <section className="rt-listado">
      <Filtros tallas={tallas} />

      <div className="rt-listado__resultados">
        <p className="rt-tenue rt-listado__conteo" aria-live="polite">
          {cargando ? "Cargando…" : `${datos?.total ?? 0} productos`}
        </p>

        <CuadriculaProductos
          productos={datos?.items ?? []}
          cargando={cargando}
          error={error}
          mensajeVacio={mensajeVacio ?? "No hay productos que coincidan con estos filtros."}
        />

        {datos && datos.total > 0 && (
          <Paginacion pagina={filtros.pagina ?? 1} total={datos.total} porPagina={POR_PAGINA} />
        )}
      </div>
    </section>
  );
}
