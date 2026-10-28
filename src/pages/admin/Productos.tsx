import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { listarProductosAdmin } from "../../lib/admin";
import { useConsulta } from "../../lib/useConsulta";
import { ETIQUETA_ESTADO, type EstadoProducto } from "../../types/domain";
import { formatearPrecio } from "../../lib/formato";

const ESTADOS: (EstadoProducto | "todos")[] = [
  "todos",
  "pendiente_revision",
  "borrador",
  "publicado",
  "agotado",
  "archivado",
];

/**
 * §10 — listado de productos del panel.
 * Lectura por ahora: la edición llega con el formulario de producto.
 */
export function ProductosPanel() {
  const [estado, setEstado] = useState<EstadoProducto | "todos">("todos");
  const { cargando, datos, error } = useConsulta(() => listarProductosAdmin(estado), [estado]);
  const ubicacion = useLocation();
  const [aviso] = useState<string | null>(
    (ubicacion.state as { guardado?: boolean } | null)?.guardado
      ? "Producto guardado. Los cambios de precio y de cantidades quedaron registrados con fecha y responsable."
      : null,
  );

  // El aviso es de un solo uso: si se recarga la página no debe reaparecer.
  useEffect(() => {
    if (aviso) window.history.replaceState({}, "");
  }, [aviso]);

  return (
    <>
      {aviso && (
        <p className="rt-aviso" role="status">
          {aviso}
        </p>
      )}

      <header className="rt-encabezado-pagina rt-encabezado-pagina--fila">
        <div>
          <p className="rt-etiqueta">Catálogo</p>
          <h1>Productos</h1>
        </div>

        <div className="rt-acciones-cabecera">
          <label className="rt-filtro-linea">
          <span>Estado</span>
            <select value={estado} onChange={(e) => setEstado(e.target.value as EstadoProducto | "todos")}>
              {ESTADOS.map((e) => (
                <option key={e} value={e}>
                  {e === "todos" ? "Todos" : ETIQUETA_ESTADO[e]}
                </option>
              ))}
            </select>
          </label>
          <Link className="rt-boton rt-boton--primario" to="/admin/productos/nuevo">
            Nuevo producto
          </Link>
        </div>
      </header>

      {error && (
        <p className="rt-error" role="alert">
          No se pudo cargar la lista: {error.message}
        </p>
      )}

      {cargando ? (
        <div className="rt-esqueleto rt-esqueleto--tabla" />
      ) : (datos ?? []).length === 0 ? (
        <div className="rt-vacio">
          <p>
            {estado === "todos"
              ? "Todavía no hay productos."
              : `No hay productos en estado «${ETIQUETA_ESTADO[estado]}».`}
          </p>
          <Link className="rt-boton rt-boton--primario" to="/admin/productos/nuevo">
            Crear el primero
          </Link>
        </div>
      ) : (
        <div className="rt-tabla-envoltura">
          <table className="rt-tabla">
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Marca</th>
                <th>Estado</th>
                <th className="rt-num">Precio</th>
                <th className="rt-num">Existencias</th>
                <th className="rt-num">Fotos</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(datos ?? []).map((p) => (
                <tr key={p.id}>
                  <td className="rt-mono">{p.codigoInterno}</td>
                  <td>{p.modelo}</td>
                  <td>{p.marca}</td>
                  <td>
                    <span className={`rt-chip rt-chip--${p.estado}`}>{ETIQUETA_ESTADO[p.estado]}</span>
                  </td>
                  <td className="rt-num">{formatearPrecio(p.precioNormal)}</td>
                  <td className="rt-num">
                    {p.existencias} <span className="rt-tenue">/ {p.tallas} tallas</span>
                  </td>
                  <td className="rt-num">{p.imagenes}</td>
                  <td className="rt-num">
                    <Link className="rt-enlace" to={`/admin/productos/${p.id}`}>
                      Editar
                    </Link>
                    {" · "}
                    <Link className="rt-enlace" to={`/producto/${p.slug}`} target="_blank">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
