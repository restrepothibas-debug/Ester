import { Link } from "react-router-dom";
import { resumenPanel } from "../../lib/admin";
import { useConsulta } from "../../lib/useConsulta";

/** §10 — dashboard: total de productos, agotados, ofertas activas y pendientes. */
export function Panel() {
  const { cargando, datos, error } = useConsulta(() => resumenPanel(), []);

  const tarjetas = [
    { etiqueta: "Productos", valor: datos?.productos, a: "/admin/productos" },
    { etiqueta: "Agotados", valor: datos?.agotados, a: "/admin/productos" },
    { etiqueta: "Pendientes de revisión", valor: datos?.pendientes, a: "/admin/productos" },
    { etiqueta: "Ofertas activas", valor: datos?.ofertasActivas },
    { etiqueta: "Destacados", valor: datos?.destacados },
    { etiqueta: "Solicitudes pendientes", valor: datos?.solicitudesPendientes },
  ];

  return (
    <>
      <header className="rt-encabezado-pagina">
        <p className="rt-etiqueta">Panel</p>
        <h1>Resumen</h1>
        <p className="rt-tenue">Estado actual del catálogo.</p>
      </header>

      {error && (
        <p className="rt-error" role="alert">
          No se pudo cargar el resumen: {error.message}
        </p>
      )}

      <div className="rt-tarjetas-dato">
        {tarjetas.map((t) => {
          const contenido = (
            <>
              <span className="rt-tarjetas-dato__valor">
                {cargando ? "—" : (t.valor ?? 0)}
              </span>
              <span className="rt-tarjetas-dato__etiqueta">{t.etiqueta}</span>
            </>
          );
          return t.a ? (
            <Link key={t.etiqueta} to={t.a} className="rt-tarjeta-dato">
              {contenido}
            </Link>
          ) : (
            <div key={t.etiqueta} className="rt-tarjeta-dato">
              {contenido}
            </div>
          );
        })}
      </div>

      {!cargando && datos?.productos === 0 && (
        <p className="rt-nota-pendiente">
          Todavía no hay productos. El catálogo público mostrará sus estados vacíos hasta que se
          cree el primero.
        </p>
      )}
    </>
  );
}
