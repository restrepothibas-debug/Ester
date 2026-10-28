import { Link } from "react-router-dom";

const ANIO = new Date().getFullYear();

/**
 * Pie de la referencia: bloque oscuro, texto a la izquierda y la marca grande a
 * la derecha, con una barra legal abajo.
 *
 * La referencia incluye alta en boletín y distintivos de pago. Aquí no hay
 * correo configurado (D-22) ni pagos en línea, así que en su lugar va cómo se
 * compra de verdad y los enlaces que existen. Las páginas de políticas siguen
 * fuera del alcance de esta versión (§2): no se enlazan destinos vacíos.
 */
export function PiePagina() {
  return (
    <footer className="rt-pie">
      <div className="rt-contenedor">
        <div className="rt-pie__rejilla">
          <div>
            <h2 className="rt-pie__titulo">Compra por WhatsApp</h2>
            <p className="rt-pie__texto">
              El catálogo no tiene carrito ni pagos en línea. Eliges el modelo, revisas la talla
              disponible y nos escribes para confirmar.
            </p>
            <nav className="rt-pie__enlaces" aria-label="Navegación del pie">
              <Link to="/">Inicio</Link>
              <Link to="/marcas">Marcas</Link>
              <Link to="/buscar">Catálogo</Link>
              <Link to="/admin">Panel</Link>
            </nav>
          </div>

          <div className="rt-pie__marca">
            <p className="rt-pie__logo">Dayara</p>
            <p className="rt-pie__lema">Catálogo de calzado</p>
          </div>
        </div>

        <div className="rt-pie__legal">
          <span>© {ANIO} Dayara store</span>
          <span>Bogotá, Colombia</span>
        </div>
      </div>
    </footer>
  );
}
