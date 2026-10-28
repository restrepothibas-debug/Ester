/**
 * Franja de cuatro garantías bajo el héroe.
 *
 * Cada línea dice algo que el sistema cumple de verdad. No hay envíos gratis,
 * garantías ni soporte 24/7 porque el negocio no los ha definido y no se
 * inventan: se describe lo que el catálogo sí hace (§8 y puntos 57–61).
 */
const ITEMS = [
  {
    titulo: "Tallas exactas",
    detalle: "Cantidad real por talla",
    icono: (
      <>
        <rect x="3" y="8" width="18" height="8" rx="1.5" />
        <path d="M7 8v3M11 8v4M15 8v3M19 8v4" strokeLinecap="round" />
      </>
    ),
  },
  {
    titulo: "Atención por WhatsApp",
    detalle: "Sin pagos en línea",
    icono: (
      <>
        <path d="M20 12a8 8 0 0 1-11.8 7L4 20l1.1-4A8 8 0 1 1 20 12Z" strokeLinejoin="round" />
        <path d="M9 10.5c.4 2 1.9 3.5 3.9 3.9" strokeLinecap="round" />
      </>
    ),
  },
  {
    titulo: "Catálogo por marcas",
    detalle: "Marcas y modelos organizados",
    icono: (
      <>
        <path d="M4 7h7l9 9-4 4-9-9V7Z" strokeLinejoin="round" />
        <circle cx="7.5" cy="10.5" r="1.2" />
      </>
    ),
  },
  {
    titulo: "Sin registro",
    detalle: "No hace falta cuenta",
    icono: (
      <>
        <circle cx="10" cy="8.5" r="3.4" />
        <path d="M3.8 19.5c.6-3.3 3.2-5.1 6.4-5.1 1.3 0 2.5.3 3.5.9" strokeLinecap="round" />
        <path d="m16 18 4-4" strokeLinecap="round" />
      </>
    ),
  },
];

export function FranjaConfianza() {
  return (
    <section className="rt-confianza" aria-label="Cómo funciona la compra">
      <div className="rt-contenedor">
        <div className="rt-confianza__fila">
          {ITEMS.map((item) => (
            <div key={item.titulo} className="rt-confianza__item">
              <svg
                className="rt-confianza__icono"
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                aria-hidden="true"
              >
                {item.icono}
              </svg>
              <div>
                <p className="rt-confianza__titulo">{item.titulo}</p>
                <p className="rt-confianza__detalle">{item.detalle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
