import { useSearchParams } from "react-router-dom";

interface Props {
  pagina: number;
  total: number;
  porPagina: number;
}

/** §4 — dividir listados extensos en páginas, con la página en la URL. */
export function Paginacion({ pagina, total, porPagina }: Props) {
  const [params, setParams] = useSearchParams();
  const paginas = Math.max(1, Math.ceil(total / porPagina));

  if (paginas <= 1) return null;

  function ir(destino: number) {
    const siguiente = new URLSearchParams(params);
    if (destino <= 1) siguiente.delete("pagina");
    else siguiente.set("pagina", String(destino));
    setParams(siguiente);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <nav className="rt-paginacion" aria-label="Paginación">
      <button type="button" onClick={() => ir(pagina - 1)} disabled={pagina <= 1}>
        Anterior
      </button>
      <span>
        Página {pagina} de {paginas}
      </span>
      <button type="button" onClick={() => ir(pagina + 1)} disabled={pagina >= paginas}>
        Siguiente
      </button>
    </nav>
  );
}
