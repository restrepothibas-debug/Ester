import { useParams, Link } from "react-router-dom";
import { obtenerMarca } from "../lib/consultas";
import { supabaseConfigurado } from "../lib/supabase";
import { useConsulta } from "../lib/useConsulta";
import { ListadoCatalogo } from "../components/ListadoCatalogo";

/** §4 — catálogo de la marca, sin pantalla intermedia de colecciones. */
export function Marca() {
  const { slug = "" } = useParams();
  const { cargando, datos } = useConsulta(
    () => (supabaseConfigurado ? obtenerMarca(slug) : Promise.resolve(null)),
    [slug, supabaseConfigurado],
  );

  if (cargando) {
    return (
      <section className="rt-seccion">
        <div className="rt-contenedor">
          <div className="rt-esqueleto rt-esqueleto--titulo" />
        </div>
      </section>
    );
  }

  if (!datos) {
    return (
      <section className="rt-seccion">
        <div className="rt-contenedor">
          <div className="rt-vacio">
            <p>Esta marca no existe o no está disponible.</p>
            <Link className="rt-enlace" to="/marcas">
              Ver todas las marcas
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rt-seccion">
      <div className="rt-contenedor">
        <header className="rt-encabezado-pagina">
          <p className="rt-etiqueta">Marca</p>
          <h1>{datos.nombre}</h1>
        </header>
        <ListadoCatalogo
          marca={datos.slug}
          mensajeVacio="Esta marca todavía no tiene productos publicados."
        />
      </div>
    </section>
  );
}
