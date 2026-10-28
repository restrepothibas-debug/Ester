import { useState } from "react";
import type { ProductoVista } from "../types/domain";
import { TarjetaProducto } from "./TarjetaProducto";
import { VentanaRapida } from "./VentanaRapida";

interface Props {
  productos: ProductoVista[];
  cargando?: boolean;
  error?: Error | null;
  mensajeVacio?: string;
}

export function CuadriculaProductos({
  productos,
  cargando = false,
  error = null,
  mensajeVacio = "Todavía no hay productos publicados.",
}: Props) {
  const [rapida, setRapida] = useState<ProductoVista | null>(null);

  if (error) {
    return (
      <div className="rt-vacio" role="alert">
        <p>No se pudo cargar el catálogo.</p>
        <p className="rt-tenue">{error.message}</p>
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="rt-cuadricula" aria-busy="true" aria-live="polite">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rt-esqueleto" />
        ))}
      </div>
    );
  }

  if (productos.length === 0) {
    return <div className="rt-vacio">{mensajeVacio}</div>;
  }

  return (
    <>
      <div className="rt-cuadricula">
        {productos.map((p) => (
          <TarjetaProducto key={p.id} producto={p} onVistaRapida={setRapida} />
        ))}
      </div>
      <VentanaRapida producto={rapida} onCerrar={() => setRapida(null)} />
    </>
  );
}
