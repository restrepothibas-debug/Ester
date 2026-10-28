import { Link } from "react-router-dom";
import { useMemo } from "react";
import { listarMarcas, listarSeleccion } from "../lib/consultas";
import { supabaseConfigurado } from "../lib/supabase";
import { useConsulta } from "../lib/useConsulta";
import { CuadriculaMarcas } from "../components/CuadriculaMarcas";
import { CuadriculaProductos } from "../components/CuadriculaProductos";

/** §4 — Inicio: hero → marcas → ofertas de la semana → productos destacados. */
export function Inicio() {
  const vacio = useMemo(() => Promise.resolve([]), []);

  const marcas = useConsulta(
    () => (supabaseConfigurado ? listarMarcas() : vacio),
    [supabaseConfigurado],
  );
  const ofertas = useConsulta(
    () => (supabaseConfigurado ? listarSeleccion("oferta_semana", 4) : vacio),
    [supabaseConfigurado],
  );
  const destacados = useConsulta(
    () => (supabaseConfigurado ? listarSeleccion("destacado", 8) : vacio),
    [supabaseConfigurado],
  );

  return (
    <>
      <section className="rt-hero">
        <div className="rt-contenedor rt-hero__interior">
          <p className="rt-etiqueta">Catálogo</p>
          <h1>
            Calzado elegido,
            <br />
            sin ruido alrededor.
          </h1>
          <p className="rt-hero__texto">
            Una selección corta de marcas y modelos. Consulta la talla disponible y escríbenos
            por WhatsApp.
          </p>
          <div className="rt-hero__acciones">
            <Link className="rt-boton rt-boton--primario" to="/marcas">
              Ver marcas
            </Link>
            <Link className="rt-boton rt-boton--secundario" to="/buscar">
              Buscar un modelo
            </Link>
          </div>
        </div>
      </section>

      <section className="rt-seccion">
        <div className="rt-contenedor">
          <header className="rt-seccion__cabecera">
            <h2>Marcas</h2>
            <Link className="rt-enlace" to="/marcas">
              Ver todas
            </Link>
          </header>
          <CuadriculaMarcas marcas={marcas.datos ?? []} cargando={marcas.cargando} />
        </div>
      </section>

      <section className="rt-seccion rt-seccion--alterna">
        <div className="rt-contenedor">
          <header className="rt-seccion__cabecera">
            <h2>Ofertas de la semana</h2>
          </header>
          <CuadriculaProductos
            productos={ofertas.datos ?? []}
            cargando={ofertas.cargando}
            error={ofertas.error}
            mensajeVacio="Esta semana todavía no hay ofertas seleccionadas."
          />
        </div>
      </section>

      <section className="rt-seccion">
        <div className="rt-contenedor">
          <header className="rt-seccion__cabecera">
            <h2>Destacados</h2>
          </header>
          <CuadriculaProductos
            productos={destacados.datos ?? []}
            cargando={destacados.cargando}
            error={destacados.error}
            mensajeVacio="Aún no hay productos destacados."
          />
        </div>
      </section>
    </>
  );
}
