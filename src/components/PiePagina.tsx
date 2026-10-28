import { Link } from "react-router-dom";

/**
 * Pie mínimo. Las páginas de Nosotros, Contacto, FAQ y políticas están
 * explícitamente fuera del alcance de la primera versión (§2), así que no se
 * enlazan aquí.
 */
export function PiePagina() {
  return (
    <footer className="rt-pie">
      <div className="rt-contenedor rt-pie__fila">
        <p className="rt-logo rt-logo--pie">
          Dayara <span>store</span>
        </p>
        <nav aria-label="Navegación del pie">
          <Link to="/">Inicio</Link>
          <Link to="/marcas">Marcas</Link>
        </nav>
        <p className="rt-tenue">Consulta de productos por WhatsApp. Sin pago en línea.</p>
      </div>
    </footer>
  );
}
