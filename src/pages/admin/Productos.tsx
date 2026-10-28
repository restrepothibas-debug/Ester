import { useState } from "react";
import { Link } from "react-router-dom";
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

  return (
    <>
      <header className="rt-encabezado-pagina rt-encabezado-pagina--fila">
        <div>
          <p className="rt-etiqueta">Catálogo</p>
          <h1>Productos</h1>
        </div>

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
          <p>No hay productos con este estado.</p>
          <p className="rt-tenue">
            El alta de productos se hace en el siguiente módulo del panel.
          </p>
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
                  <td>
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
