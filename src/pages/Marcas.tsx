import { useMemo } from "react";
import { listarMarcas } from "../lib/consultas";
import { supabaseConfigurado } from "../lib/supabase";
import { useConsulta } from "../lib/useConsulta";
import { CuadriculaMarcas } from "../components/CuadriculaMarcas";

/** §4 — cuadrícula de logotipos, sin pantallas intermedias. */
export function Marcas() {
  const vacio = useMemo(() => Promise.resolve([]), []);
  const { cargando, datos } = useConsulta(
    () => (supabaseConfigurado ? listarMarcas() : vacio),
    [supabaseConfigurado],
  );

  return (
    <section className="rt-seccion">
      <div className="rt-contenedor">
        <header className="rt-encabezado-pagina">
          <p className="rt-etiqueta">Catálogo</p>
          <h1>Marcas</h1>
          <p className="rt-tenue">Cada marca abre directamente su catálogo de productos.</p>
        </header>
        <CuadriculaMarcas marcas={datos ?? []} cargando={cargando} />
      </div>
    </section>
  );
}
