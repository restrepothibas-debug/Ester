import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { iniciarSesion, useSesionAdmin } from "../../lib/auth";

/**
 * §10 — acceso al panel: una sola cuenta, sin registro público.
 * El segundo factor (2FA) se añade sobre esta pantalla cuando la cuenta exista.
 */
export function Acceso() {
  const { sesion, admin, cargando } = useSesionAdmin();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const destino = (ubicacion.state as { desde?: string } | null)?.desde ?? "/admin";

  if (!cargando && sesion && admin) return <Navigate to={destino} replace />;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await iniciarSesion(correo, contrasena);
      navegar(destino, { replace: true });
    } catch (fallo) {
      const mensaje = fallo instanceof Error ? fallo.message : String(fallo);
      // Los mensajes de Supabase vienen en inglés; se traduce lo que el usuario ve.
      setError(
        /invalid login credentials/i.test(mensaje)
          ? "Correo o contraseña incorrectos."
          : mensaje,
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="rt-seccion">
      <div className="rt-contenedor rt-acceso">
        <div className="rt-acceso__caja">
          <p className="rt-etiqueta">Panel privado</p>
          <h1>Acceso</h1>
          <p className="rt-tenue">
            Solo la cuenta administradora. No hay registro público ni recuperación automática
            en esta versión.
          </p>

          {sesion && !admin && (
            <p className="rt-nota-pendiente" role="alert">
              La sesión existe, pero esta cuenta no tiene perfil de administrador activo.
            </p>
          )}

          <form onSubmit={enviar} className="rt-formulario">
            <label>
              <span>Correo</span>
              <input
                type="email"
                autoComplete="username"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
              />
            </label>

            <label>
              <span>Contraseña</span>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
              />
            </label>

            {error && (
              <p className="rt-error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="rt-boton rt-boton--primario" disabled={enviando}>
              {enviando ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
