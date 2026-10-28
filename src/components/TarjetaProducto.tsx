import { Link } from "react-router-dom";
import type { ProductoVista } from "../types/domain";
import { calcularDescuento, formatearPrecio, iniciales, resumenTallas } from "../lib/formato";

interface Props {
  producto: ProductoVista;
  onVistaRapida?: (producto: ProductoVista) => void;
}

/** §4 — tarjeta minimalista: dos por fila en móvil, sin listar todas las tallas. */
export function TarjetaProducto({ producto, onVistaRapida }: Props) {
  const descuento = producto.enPromocion
    ? calcularDescuento(producto.precioNormal, producto.precioVigente)
    : null;

  return (
    <article className="rt-tarjeta">
      <Link to={`/producto/${producto.slug}`} className="rt-tarjeta__media">
        {producto.imagenPrincipal ? (
          <img src={producto.imagenMini ?? producto.imagenPrincipal} alt={producto.modelo} loading="lazy" />
        ) : (
          <div className="rt-tarjeta__marcador" aria-hidden="true">
            {iniciales(producto.marca)}
          </div>
        )}

        {producto.agotado && <span className="rt-insignia rt-insignia--agotado">Agotado</span>}
        {descuento !== null && (
          <span className="rt-insignia rt-insignia--descuento">−{descuento}%</span>
        )}
      </Link>

      <div className="rt-tarjeta__cuerpo">
        <p className="rt-etiqueta">{producto.marca}</p>
        <h3 className="rt-tarjeta__modelo">
          <Link to={`/producto/${producto.slug}`}>{producto.modelo}</Link>
        </h3>

        <p className="rt-tarjeta__precio">
          {producto.enPromocion && (
            <span className="rt-precio--tachado">{formatearPrecio(producto.precioNormal)}</span>
          )}
          <span className={producto.enPromocion ? "rt-precio--vigente" : undefined}>
            {formatearPrecio(producto.precioVigente)}
          </span>
        </p>

        <p className="rt-tarjeta__tallas">{resumenTallas(producto.tallas)}</p>

        {onVistaRapida && !producto.agotado && (
          <button type="button" className="rt-enlace-boton" onClick={() => onVistaRapida(producto)}>
            Vista rápida
          </button>
        )}
      </div>
    </article>
  );
}
