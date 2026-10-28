import { Navigate, useLocation } from "react-router-dom";
import { useSesionAdmin } from "../../lib/auth";
import { DisposicionAdmin } from "./DisposicionAdmin";

/**
 * Puerta del panel: exige sesión **y** perfil de administrador activo.
 * Ocultar el panel no es seguridad —RLS ya impide escribir— pero sin sesión
 * válida no tiene sentido mostrar la interfaz.
 */
export function RutaPrivada({ children }: { children: React.ReactNode }) {
  const { cargando, sesion, admin, error } = useSesionAdmin();
  const ubicacion = useLocation();

  if (cargando) {
    return (
      <div className="rt-contenedor rt-cargando-panel" aria-busy="true">
        <div className="rt-esqueleto rt-esqueleto--titulo" />
      </div>
    );
  }

  if (!sesion) {
    return <Navigate to="/admin/login" replace state={{ desde: ubicacion.pathname }} />;
  }

  if (!admin) {
    return (
      <section className="rt-seccion">
        <div className="rt-contenedor">
          <div className="rt-vacio">
            <p>Esta cuenta no tiene permisos de administrador.</p>
            {error && <p className="rt-tenue">{error.message}</p>}
          </div>
        </div>
      </section>
    );
  }

  return <DisposicionAdmin>{children}</DisposicionAdmin>;
}
