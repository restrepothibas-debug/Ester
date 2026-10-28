import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { ProductoVista } from "../types/domain";
import { formatearPrecio, iniciales, ordenarTallas } from "../lib/formato";
import { BotonWhatsApp } from "./BotonWhatsApp";

interface Props {
  producto: ProductoVista | null;
  onCerrar: () => void;
}

/** §4 — ventana rápida: consultar y elegir talla sin abandonar el catálogo. */
export function VentanaRapida({ producto, onCerrar }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [talla, setTalla] = useState<string | null>(null);

  useEffect(() => {
    const el = dialogo.current;
    if (!el) return;
    if (producto && !el.open) {
      setTalla(null);
      el.showModal();
    }
    if (!producto && el.open) el.close();
  }, [producto]);

  if (!producto) return <dialog ref={dialogo} className="rt-dialogo" />;

  const tallas = ordenarTallas(producto.tallas.filter((t) => t.cantidad > 0));

  return (
    <dialog
      ref={dialogo}
      className="rt-dialogo"
      onClose={onCerrar}
      onClick={(e) => {
        if (e.target === dialogo.current) onCerrar();
      }}
    >
      <div className="rt-dialogo__contenido">
        <button type="button" className="rt-dialogo__cerrar" onClick={onCerrar} aria-label="Cerrar">
          ×
        </button>

        <div className="rt-dialogo__media">
          {producto.imagenPrincipal ? (
            <img src={producto.imagenMini ?? producto.imagenPrincipal} alt={producto.modelo} />
          ) : (
            <div className="rt-tarjeta__marcador rt-tarjeta__marcador--grande" aria-hidden="true">
              {iniciales(producto.marca)}
            </div>
          )}
        </div>

        <div className="rt-dialogo__datos">
          <p className="rt-etiqueta">{producto.marca}</p>
          <h2>{producto.modelo}</h2>
          {producto.referencia && <p className="rt-tenue">Referencia {producto.referencia}</p>}

          <p className="rt-dialogo__precio">
            {producto.enPromocion && (
              <span className="rt-precio--tachado">{formatearPrecio(producto.precioNormal)}</span>
            )}
            <span>{formatearPrecio(producto.precioVigente)}</span>
          </p>

          <fieldset className="rt-tallas">
            <legend>Talla</legend>
            {tallas.length === 0 ? (
              <p className="rt-tenue">Sin tallas disponibles.</p>
            ) : (
              tallas.map((t) => (
                <button
                  key={t.talla}
                  type="button"
                  className={`rt-talla ${talla === t.talla ? "rt-talla--activa" : ""}`}
                  onClick={() => setTalla(t.talla)}
                  aria-pressed={talla === t.talla}
                >
                  {t.talla}
                </button>
              ))
            )}
          </fieldset>

          <BotonWhatsApp producto={producto} talla={talla} />

          <Link className="rt-enlace" to={`/producto/${producto.slug}`} onClick={onCerrar}>
            Ver ficha completa
          </Link>
        </div>
      </div>
    </dialog>
  );
}
