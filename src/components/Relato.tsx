/**
 * Bloque de tres columnas de la referencia, con contenido del proyecto.
 *
 * La referencia lo usaba para contar un caso de éxito con métricas de negocio.
 * Ese contenido no existe aquí y no se inventa: las tres columnas cuentan el
 * recorrido real (cómo se compra), lo que el catálogo muestra y lo que hay
 * disponible ahora, con cifras que salen de la base.
 */
interface Props {
  cifras: { productos: number; marcas: number; tallas: number } | null;
}

const PASOS = [
  { valor: "01", etiqueta: "Elige el modelo" },
  { valor: "02", etiqueta: "Mira la talla" },
  { valor: "03", etiqueta: "Escríbenos" },
];

const GARANTIAS = [
  "Disponibilidad exacta por talla",
  "Precio visible y promociones con fecha de fin",
  "Marcas y modelos organizados",
  "Estados claros: disponible o agotado",
  "Sin carrito ni pagos en línea",
];

export function Relato({ cifras }: Props) {
  return (
    <section className="rt-relato" aria-label="Cómo funciona">
      <div className="rt-relato__columna rt-relato__columna--imagen">
        <p className="rt-etiqueta">Cómo funciona</p>
        <h2>Del catálogo a tu talla, sin intermediarios.</h2>
        <p className="rt-relato__texto">
          No hay pasos ocultos: eliges el modelo, ves qué tallas quedan y nos escribes. La
          conversación cierra el pedido, no un formulario.
        </p>
        <div className="rt-relato__cifras">
          {PASOS.map((paso) => (
            <p key={paso.valor} className="rt-relato__cifra">
              <strong>{paso.valor}</strong>
              <span>{paso.etiqueta}</span>
            </p>
          ))}
        </div>
      </div>

      <div className="rt-relato__columna rt-relato__columna--clara">
        <p className="rt-etiqueta">Catálogo claro</p>
        <h2>Un catálogo corto, con lo que importa.</h2>
        <p className="rt-relato__texto">
          Cada ficha dice marca, modelo, precio y tallas disponibles. Lo que no hay, no se
          muestra.
        </p>
        <ul className="rt-relato__lista">
          {GARANTIAS.map((texto) => (
            <li key={texto}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{texto}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rt-relato__columna rt-relato__columna--verde">
        <p className="rt-etiqueta">Disponibilidad</p>
        <h2>Lo que ves, está.</h2>
        <p className="rt-relato__texto">
          Las cifras salen del inventario, no de una campaña: se actualizan cada vez que se
          confirma una solicitud.
        </p>
        <div className="rt-relato__cifras">
          <p className="rt-relato__cifra">
            <strong>{cifras ? cifras.productos : "—"}</strong>
            <span>Modelos publicados</span>
          </p>
          <p className="rt-relato__cifra">
            <strong>{cifras ? cifras.marcas : "—"}</strong>
            <span>Marcas</span>
          </p>
          <p className="rt-relato__cifra">
            <strong>{cifras ? cifras.tallas : "—"}</strong>
            <span>Tallas con stock</span>
          </p>
        </div>
      </div>
    </section>
  );
}
