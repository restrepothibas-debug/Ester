import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { obtenerProducto } from "../lib/consultas";
import { supabaseConfigurado } from "../lib/supabase";
import { useConsulta } from "../lib/useConsulta";
import { calcularDescuento, formatearPrecio, iniciales, ordenarTallas } from "../lib/formato";
import { BotonWhatsApp } from "../components/BotonWhatsApp";

/** §6 — ficha completa con datos, fotos, precio, tallas disponibles y WhatsApp. */
export function Producto() {
  const { slug = "" } = useParams();
  const { cargando, datos } = useConsulta(
    () => (supabaseConfigurado ? obtenerProducto(slug) : Promise.resolve(null)),
    [slug, supabaseConfigurado],
  );
  const [talla, setTalla] = useState<string | null>(null);
  const [imagenActiva, setImagenActiva] = useState(0);

  if (cargando) {
    return (
      <section className="rt-seccion">
        <div className="rt-contenedor rt-ficha">
          <div className="rt-esqueleto rt-esqueleto--ficha" />
        </div>
      </section>
    );
  }

  if (!datos) {
    return (
      <section className="rt-seccion">
        <div className="rt-contenedor">
          <div className="rt-vacio">
            <p>Este producto no existe o ya no está publicado.</p>
            <Link className="rt-enlace" to="/marcas">
              Volver al catálogo
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const tallas = ordenarTallas(datos.tallas.filter((t) => t.cantidad > 0));
  const descuento = datos.enPromocion
    ? calcularDescuento(datos.precioNormal, datos.precioVigente)
    : null;
  const imagen = datos.imagenes[imagenActiva] ?? datos.imagenPrincipal;

  return (
    <section className="rt-seccion">
      <div className="rt-contenedor">
        <nav className="rt-migas" aria-label="Ruta">
          <Link to="/">Inicio</Link>
          <span>/</span>
          <Link to={`/marca/${datos.marcaSlug}`}>{datos.marca}</Link>
          <span>/</span>
          <span aria-current="page">{datos.modelo}</span>
        </nav>

        <div className="rt-ficha">
          <div className="rt-ficha__galeria">
            {imagen ? (
              <img className="rt-ficha__imagen" src={imagen} alt={datos.modelo} />
            ) : (
              <div className="rt-tarjeta__marcador rt-tarjeta__marcador--grande" aria-hidden="true">
                {iniciales(datos.marca)}
              </div>
            )}

            {datos.imagenes.length > 1 && (
              <div className="rt-miniaturas">
                {datos.imagenes.map((ruta, i) => (
                  <button
                    key={ruta}
                    type="button"
                    className={`rt-miniatura ${i === imagenActiva ? "rt-miniatura--activa" : ""}`}
                    onClick={() => setImagenActiva(i)}
                    aria-label={`Ver imagen ${i + 1}`}
                  >
                    <img src={ruta} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rt-ficha__datos">
            <p className="rt-etiqueta">{datos.marca}</p>
            <h1>{datos.modelo}</h1>
            {datos.referencia && <p className="rt-tenue">Referencia {datos.referencia}</p>}

            <p className="rt-ficha__precio">
              {datos.enPromocion && (
                <span className="rt-precio--tachado">{formatearPrecio(datos.precioNormal)}</span>
              )}
              <span>{formatearPrecio(datos.precioVigente)}</span>
              {descuento !== null && <span className="rt-insignia rt-insignia--descuento">−{descuento}%</span>}
            </p>

            {datos.agotado ? (
              <p className="rt-nota-pendiente">
                Producto agotado. Puedes verlo, pero no iniciar una solicitud por ahora.
              </p>
            ) : (
              <>
                <fieldset className="rt-tallas">
                  <legend>Talla disponible</legend>
                  {tallas.map((t) => (
                    <button
                      key={t.talla}
                      type="button"
                      className={`rt-talla ${talla === t.talla ? "rt-talla--activa" : ""}`}
                      onClick={() => setTalla(t.talla)}
                      aria-pressed={talla === t.talla}
                    >
                      {t.talla}
                    </button>
                  ))}
                </fieldset>
                <BotonWhatsApp producto={datos} talla={talla} />
              </>
            )}

            <dl className="rt-ficha__especificaciones">
              <div>
                <dt>Código</dt>
                <dd>{datos.codigoInterno}</dd>
              </div>
              {datos.color && (
                <div>
                  <dt>Color</dt>
                  <dd>{datos.color}</dd>
                </div>
              )}
              <div>
                <dt>Disponibilidad</dt>
                <dd>{datos.agotado ? "Agotado" : `${tallas.length} tallas`}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
