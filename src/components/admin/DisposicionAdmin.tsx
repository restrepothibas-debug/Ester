import { NavLink, useNavigate } from "react-router-dom";
import { cerrarSesion } from "../../lib/auth";

const ENLACES = [
  { a: "/admin", texto: "Resumen", fin: true },
  { a: "/admin/productos", texto: "Productos", fin: false },
  { a: "/admin/marcas", texto: "Marcas", fin: false },
  { a: "/admin/inventario", texto: "Inventario", fin: false },
  { a: "/admin/promociones", texto: "Promociones", fin: false },
  { a: "/admin/destacados", texto: "Destacados", fin: false },
  { a: "/admin/solicitudes", texto: "Solicitudes", fin: false },
];

/** Marco del panel: navegación mínima y salida de sesión. */
export function DisposicionAdmin({ children }: { children: React.ReactNode }) {
  const navegar = useNavigate();

  async function salir() {
    await cerrarSesion();
    navegar("/admin/login", { replace: true });
  }

  return (
    <div className="rt-admin">
      <aside className="rt-admin__lateral">
        <span className="rt-logo rt-logo--panel">Dayara</span>
        <span className="rt-logo__lema rt-logo__lema--panel">Catálogo de calzado</span>
        <p className="rt-etiqueta">Panel</p>

        <nav className="rt-admin__nav">
          {ENLACES.map((e) => (
            <NavLink
              key={e.a}
              to={e.a}
              end={e.fin}
              className={({ isActive }) => (isActive ? "rt-admin__enlace rt-admin__enlace--activo" : "rt-admin__enlace")}
            >
              {e.texto}
            </NavLink>
          ))}
        </nav>

        <button type="button" className="rt-enlace-boton rt-admin__salir" onClick={salir}>
          Cerrar sesión
        </button>
      </aside>

      <div className="rt-admin__contenido">{children}</div>
    </div>
  );
}
