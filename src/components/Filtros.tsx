import { useSearchParams } from "react-router-dom";

interface Props {
  tallas?: string[];
}

/**
 * §4 — filtros por talla, precio y modelo.
 * Viven en la URL para que un enlace compartido reproduzca lo mismo que se vio.
 */
export function Filtros({ tallas = [] }: Props) {
  const [params, setParams] = useSearchParams();

  function actualizar(clave: string, valor: string) {
    const siguiente = new URLSearchParams(params);
    if (valor) siguiente.set(clave, valor);
    else siguiente.delete(clave);
    siguiente.delete("pagina");
    setParams(siguiente, { replace: true });
  }

  const hayFiltros = ["talla", "precioMax", "modelo"].some((k) => params.has(k));

  return (
    <div className="rt-filtros">
      <label>
        <span>Talla</span>
        <select value={params.get("talla") ?? ""} onChange={(e) => actualizar("talla", e.target.value)}>
          <option value="">Todas</option>
          {tallas.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Precio máximo</span>
        <input
          type="number"
          min={0}
          step={10000}
          inputMode="numeric"
          placeholder="Sin límite"
          defaultValue={params.get("precioMax") ?? ""}
          onBlur={(e) => actualizar("precioMax", e.target.value)}
        />
      </label>

      <label>
        <span>Modelo</span>
        <input
          type="search"
          placeholder="Ej. bota"
          defaultValue={params.get("modelo") ?? ""}
          onBlur={(e) => actualizar("modelo", e.target.value)}
        />
      </label>

      {hayFiltros && (
        <button type="button" className="rt-enlace-boton" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
