import { Link } from "react-router-dom";
import { useMemo } from "react";
import { contarCatalogo, listarMarcas, listarSeleccion } from "../lib/consultas";
import { supabaseConfigurado } from "../lib/supabase";
import { useConsulta } from "../lib/useConsulta";
import { iniciales } from "../lib/formato";
import { CuadriculaProductos } from "../components/CuadriculaProductos";
import { FranjaConfianza } from "../components/FranjaConfianza";
import { Relato } from "../components/Relato";

/**
 * §4 — Inicio, reconstruido sobre la referencia visual:
 * héroe → garantías → accesos por marca → relato en tres columnas →
 * destacados → ofertas de la semana.
 *
 * La foto del héroe es la del primer producto destacado. Mientras no haya
 * fotografías (D-28), el fondo es el degradado cálido del sistema: no se usa
 * una imagen de banco que aparente ser mercancía de la tienda.
 */
export function Inicio() {
  const vacio = useMemo(() => Promise.resolve([]), []);
  const sinCifras = useMemo(
    () => Promise.resolve({ productos: 0, marcas: 0, tallas: 0 }),
    [],
  );

  const marcas = useConsulta(
    () => (supabaseConfigurado ? listarMarcas() : vacio),
    [supabaseConfigurado],
  );
  const ofertas = useConsulta(
    () => (supabaseConfigurado ? listarSeleccion("oferta_semana", 4) : vacio),
    [supabaseConfigurado],
  );
  const destacados = useConsulta(
    () => (supabaseConfigurado ? listarSeleccion("destacado", 5) : vacio),
    [supabaseConfigurado],
  );
  const cifras = useConsulta(
    () => (supabaseConfigurado ? contarCatalogo() : sinCifras),
    [supabaseConfigurado],
  );

  const portada = destacados.datos?.find((p) => p.imagenPrincipal)?.imagenPrincipal ?? null;

  return (
    <>
      <section
        className="rt-hero"
        style={portada ? { backgroundImage: `url("${portada}")` } : undefined}
      >
        <div className="rt-contenedor rt-hero__interior">
          <div aria-hidden="true" />
          <div className="rt-hero__texto">
            <p className="rt-etiqueta">Catálogo de calzado</p>
            <h1>
              Calzado elegido,
              <br />
              sin ruido alrededor.
            </h1>
            <p className="rt-hero__entradilla">
              Una selección corta de marcas y modelos. Consulta la talla disponible y escríbenos
              por WhatsApp.
            </p>
            <div className="rt-hero__acciones">
              <Link className="rt-boton rt-boton--primario" to="/marcas">
                Ver el catálogo
              </Link>
            </div>
          </div>
        </div>

        <div className="rt-hero__pie">
          <span className="rt-hero__novedad">Novedades</span>
          <Link className="rt-hero__pildora" to="/buscar">
            Explorar modelos
          </Link>
        </div>
      </section>

      <FranjaConfianza />

      <section className="rt-accesos" aria-labelledby="titulo-marcas">
        <div className="rt-contenedor">
          <div className="rt-seccion__cabecera">
            <div className="rt-seccion__titulo">
              <p className="rt-etiqueta">Por marca</p>
              <h2 id="titulo-marcas">Elige por marca</h2>
            </div>
            <Link className="rt-enlace" to="/marcas">
              Ver todas
            </Link>
          </div>

          {marcas.cargando ? (
            <div className="rt-accesos__rejilla">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rt-esqueleto rt-esqueleto--marca" />
              ))}
            </div>
          ) : (marcas.datos ?? []).length === 0 ? (
            <div className="rt-vacio">Todavía no hay marcas activas.</div>
          ) : (
            <div className="rt-accesos__rejilla">
              {(marcas.datos ?? []).slice(0, 4).map((m) => (
                <Link key={m.id} to={`/marca/${m.slug}`} className="rt-acceso-marca">
                  <div className="rt-acceso-marca__media">
                    {m.logoRuta ? (
                      <img src={m.logoRuta} alt={m.nombre} loading="lazy" />
                    ) : (
                      <span className="rt-acceso-marca__iniciales" aria-hidden="true">
                        {iniciales(m.nombre)}
                      </span>
                    )}
                  </div>
                  <div className="rt-acceso-marca__pie">
                    <p className="rt-acceso-marca__nombre">{m.nombre}</p>
                    <span className="rt-acceso-marca__accion">Ver marca →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Relato cifras={cifras.datos ?? null} />

      <section className="rt-seccion rt-seccion--alterna rt-seccion--cinco" aria-labelledby="titulo-destacados">
        <div className="rt-contenedor">
          <div className="rt-seccion__cabecera">
            <div className="rt-seccion__titulo">
              <p className="rt-etiqueta">Colección destacada</p>
              <h2 id="titulo-destacados">Destacados</h2>
            </div>
            <Link className="rt-enlace" to="/buscar">
              Ver todo
            </Link>
          </div>

          <CuadriculaProductos
            productos={destacados.datos ?? []}
            cargando={destacados.cargando}
            error={destacados.error}
            mensajeVacio="El administrador todavía no ha elegido destacados."
          />
        </div>
      </section>

      <section className="rt-seccion" aria-labelledby="titulo-ofertas">
        <div className="rt-contenedor">
          <div className="rt-seccion__cabecera">
            <div className="rt-seccion__titulo">
              <p className="rt-etiqueta">Selección de la semana</p>
              <h2 id="titulo-ofertas">Ofertas</h2>
            </div>
            <Link className="rt-enlace" to="/buscar">
              Ver todo
            </Link>
          </div>

          <CuadriculaProductos
            productos={ofertas.datos ?? []}
            cargando={ofertas.cargando}
            error={ofertas.error}
            mensajeVacio="Esta semana no hay una selección publicada."
          />
        </div>
      </section>
    </>
  );
}
