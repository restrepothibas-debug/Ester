import { Link } from "react-router-dom";
import type { Marca } from "../types/domain";
import { iniciales } from "../lib/formato";

interface Props {
  marcas: Marca[];
  cargando?: boolean;
}

/**
 * §4 — cuadrícula de logotipos; cada marca abre directamente su catálogo.
 * El slug viene de la base (`nombre_normalizado`), no se calcula en el cliente:
 * una sola regla, sin discrepancias entre la URL y la fila.
 */
export function CuadriculaMarcas({ marcas, cargando = false }: Props) {
  if (cargando) {
    return (
      <div className="rt-marcas" aria-busy="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rt-esqueleto rt-esqueleto--marca" />
        ))}
      </div>
    );
  }

  if (marcas.length === 0) {
    return <div className="rt-vacio">Todavía no hay marcas activas.</div>;
  }

  return (
    <div className="rt-marcas">
      {marcas.map((m) => (
        <Link key={m.id} to={`/marca/${m.slug}`} className="rt-marca">
          {m.logoRuta ? (
            <img src={m.logoRuta} alt={m.nombre} />
          ) : (
            <span aria-hidden="true">{iniciales(m.nombre)}</span>
          )}
          <small>{m.nombre}</small>
        </Link>
      ))}
    </div>
  );
}
