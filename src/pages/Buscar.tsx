import { useSearchParams } from "react-router-dom";
import { ListadoCatalogo } from "../components/ListadoCatalogo";

/** §4 — resultados de búsqueda; el término vive en la URL. */
export function Buscar() {
  const [params] = useSearchParams();
  const q = (params.get("q") ?? "").trim();

  return (
    <section className="rt-seccion">
      <div className="rt-contenedor">
        <header className="rt-encabezado-pagina">
          <p className="rt-etiqueta">Búsqueda</p>
          <h1>{q ? `Resultados para «${q}»` : "Buscar en el catálogo"}</h1>
          <p className="rt-tenue">Se busca por modelo, referencia, color y código interno.</p>
        </header>

        <ListadoCatalogo
          q={q || undefined}
          mensajeVacio={q ? "Ningún producto coincide con esa búsqueda." : "Escribe un modelo, referencia o color."}
        />
      </div>
    </section>
  );
}
