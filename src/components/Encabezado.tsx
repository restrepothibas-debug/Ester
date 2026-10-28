import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sugerencias } from "../lib/consultas";
import { supabaseConfigurado } from "../lib/supabase";
import { formatearPrecio } from "../lib/formato";
import type { ProductoVista } from "../types/domain";

/** §4 — búsqueda con sugerencias mientras se escribe. */
export function Encabezado() {
  const [texto, setTexto] = useState("");
  const [lista, setLista] = useState<ProductoVista[]>([]);
  const [abierto, setAbierto] = useState(false);
  const navegar = useNavigate();
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!supabaseConfigurado || texto.trim().length < 2) {
      setLista([]);
      return;
    }
    const t = setTimeout(() => {
      sugerencias(texto)
        .then(setLista)
        .catch(() => setLista([]));
    }, 250);
    return () => clearTimeout(t);
  }, [texto]);

  useEffect(() => {
    function fuera(e: MouseEvent) {
      if (!contenedor.current?.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  }, []);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const q = texto.trim();
    if (!q) return;
    setAbierto(false);
    navegar(`/buscar?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="rt-encabezado">
      <div className="rt-contenedor rt-encabezado__fila">
        <Link to="/" className="rt-logo">
          Dayara <span>store</span>
        </Link>

        <nav className="rt-nav" aria-label="Navegación principal">
          <Link to="/">Inicio</Link>
          <Link to="/marcas">Marcas</Link>
        </nav>

        <div className="rt-buscador" ref={contenedor}>
          <form onSubmit={enviar} role="search">
            <input
              type="search"
              value={texto}
              onChange={(e) => {
                setTexto(e.target.value);
                setAbierto(true);
              }}
              onFocus={() => setAbierto(true)}
              placeholder="Buscar modelo, referencia o color"
              aria-label="Buscar en el catálogo"
            />
          </form>

          {abierto && lista.length > 0 && (
            <ul className="rt-sugerencias">
              {lista.map((p) => (
                <li key={p.id}>
                  <Link to={`/producto/${p.slug}`} onClick={() => setAbierto(false)}>
                    <span className="rt-sugerencias__marca">{p.marca}</span>
                    <span className="rt-sugerencias__modelo">{p.modelo}</span>
                    <span className="rt-sugerencias__precio">
                      {formatearPrecio(p.precioVigente)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </header>
  );
}
