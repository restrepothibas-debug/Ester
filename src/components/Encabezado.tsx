import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { sugerencias } from "../lib/consultas";
import { supabaseConfigurado } from "../lib/supabase";
import { formatearPrecio } from "../lib/formato";
import type { ProductoVista } from "../types/domain";

/**
 * Cabecera de la referencia: marca a la izquierda con su lema, navegación al
 * centro e iconos a la derecha. La búsqueda se abre en un panel bajo la barra
 * para no romper la línea del diseño.
 *
 * No hay carrito ni lista de deseos: el catálogo no vende en línea (§8), así que
 * no se dibujan controles que no harían nada.
 */
export function Encabezado() {
  const [buscando, setBuscando] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [lista, setLista] = useState<ProductoVista[]>([]);
  const [abierto, setAbierto] = useState(false);
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const contenedor = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!supabaseConfigurado || texto.trim().length < 2) {
        setLista([]);
        return;
      }
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

  useEffect(() => {
    if (buscando) campo.current?.focus();
  }, [buscando]);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const q = texto.trim();
    if (!q) return;
    setAbierto(false);
    setBuscando(false);
    navegar(`/buscar?q=${encodeURIComponent(q)}`);
  }

  function actual(pagina: string) {
    if (pagina === "/") return ubicacion.pathname === "/" ? "page" : undefined;
    return ubicacion.pathname.startsWith(pagina) ? "page" : undefined;
  }

  return (
    <header className="rt-encabezado">
      <div className={`rt-contenedor rt-encabezado__fila ${menuAbierto ? "rt-encabezado__fila--menu" : ""}`}>
        <Link to="/" className="rt-marca-cabecera" aria-label="Dayara store, inicio">
          <span className="rt-logo">Dayara</span>
          <span className="rt-logo__lema">Catálogo de calzado</span>
        </Link>

        <nav
          className={`rt-nav ${menuAbierto ? "rt-nav--abierta" : ""}`}
          aria-label="Navegación principal"
        >
          <Link to="/" aria-current={actual("/")}>
            Inicio
          </Link>
          <Link to="/marcas" aria-current={actual("/marca")}>
            Marcas
          </Link>
          <Link to="/buscar" aria-current={actual("/buscar")}>
            Catálogo
          </Link>
        </nav>

        <div className="rt-acciones-cabecera">
          <button
            type="button"
            className="rt-icono-boton"
            aria-label="Buscar en el catálogo"
            aria-expanded={buscando}
            onClick={() => setBuscando((v) => !v)}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
          </button>

          <Link to="/admin" className="rt-icono-boton" aria-label="Acceso al panel">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
              <circle cx="12" cy="8.5" r="3.6" />
              <path d="M4.8 20c.6-3.6 3.6-5.6 7.2-5.6s6.6 2 7.2 5.6" strokeLinecap="round" />
            </svg>
          </Link>

          <button
            type="button"
            className="rt-icono-boton rt-menu-movil"
            aria-label="Abrir menú"
            aria-expanded={menuAbierto}
            onClick={() => setMenuAbierto((v) => !v)}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {buscando && (
        <div className="rt-panel-busqueda">
          <div className="rt-contenedor">
            <div className="rt-buscador" ref={contenedor}>
              <form onSubmit={enviar} role="search">
                <label className="rt-solo-lectores" htmlFor="busqueda-cabecera">
                  Buscar en el catálogo
                </label>
                <input
                  id="busqueda-cabecera"
                  ref={campo}
                  type="search"
                  value={texto}
                  onChange={(e) => {
                    setTexto(e.target.value);
                    setAbierto(true);
                  }}
                  onFocus={() => setAbierto(true)}
                  placeholder="Modelo, referencia o color"
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
        </div>
      )}
    </header>
  );
}
