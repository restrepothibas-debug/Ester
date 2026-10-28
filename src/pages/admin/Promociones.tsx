import { useState } from "react";
import {
  estadoPromocion,
  listarPromocionesAdmin,
  opcionesProductos,
  type FilaPromocionAdmin,
} from "../../lib/admin";
import {
  actualizarPromocion,
  crearPromocion,
  finalizarPromocion,
  type EntradaPromocion,
} from "../../lib/mutaciones";
import { useConsulta } from "../../lib/useConsulta";
import { calcularDescuento, formatearPrecio } from "../../lib/formato";
import {
  ahoraEnBogota,
  ahoraISO,
  fechaBogotaAInput,
  fechaLocalABogota,
  formatearFecha,
} from "../../lib/fechas";

const ETIQUETA_ESTADO: Record<ReturnType<typeof estadoPromocion>, string> = {
  vigente: "Vigente",
  programada: "Programada",
  vencida: "Vencida",
  terminada: "Terminada",
};

/**
 * Punto 45 — promociones manuales y programadas con fecha final.
 *
 * El precio promocional vive solo en `promociones`; `productos` conserva el
 * normal. Una sola promoción vigente por producto y siempre por debajo del
 * precio de lista: lo impone la base (D-31, D-32). Las fechas se escriben y se
 * leen en America/Bogota (D-34).
 *
 * La oferta de la semana NO se gestiona aquí: es una selección (D-33).
 */
export function Promociones() {
  const [refresco, setRefresco] = useState(0);
  const promociones = useConsulta(() => listarPromocionesAdmin(), [refresco]);
  const productos = useConsulta(() => opcionesProductos(), []);

  const [editando, setEditando] = useState<FilaPromocionAdmin | null>(null);
  const [productoId, setProductoId] = useState("");
  const [precio, setPrecio] = useState("");
  const [tipo, setTipo] = useState<"manual" | "programada">("manual");
  const [inicio, setInicio] = useState(ahoraEnBogota);
  const [fin, setFin] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const lista = promociones.datos ?? [];
  const opciones = productos.datos ?? [];
  const seleccionado = opciones.find((p) => p.id === productoId) ?? null;
  const numeroPrecio = Number(precio.replace(/[^\d]/g, ""));
  const descuento =
    seleccionado && numeroPrecio > 0
      ? calcularDescuento(seleccionado.precioNormal, numeroPrecio)
      : null;

  function limpiar() {
    setEditando(null);
    setProductoId("");
    setPrecio("");
    setTipo("manual");
    setInicio(ahoraEnBogota());
    setFin("");
    setFallo(null);
  }

  function editar(fila: FilaPromocionAdmin) {
    setEditando(fila);
    setProductoId(fila.productoId);
    setPrecio(String(fila.precioPromocional));
    setTipo(fila.tipo);
    setInicio(fechaBogotaAInput(fila.iniciaEn));
    setFin(fechaBogotaAInput(fila.terminaEn));
    setFallo(null);
    setAviso(null);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setFallo(null);
    setAviso(null);

    if (!productoId) return setFallo("Elige el producto de la promoción.");
    if (!Number.isFinite(numeroPrecio) || numeroPrecio <= 0) {
      return setFallo("Escribe un precio promocional mayor que cero.");
    }
    if (seleccionado && numeroPrecio >= seleccionado.precioNormal) {
      return setFallo(
        `El precio promocional debe ser menor que el normal (${formatearPrecio(seleccionado.precioNormal)}).`,
      );
    }

    const iniciaEn = tipo === "manual" && !editando ? ahoraISO() : fechaLocalABogota(inicio);
    if (!iniciaEn) return setFallo("La fecha de inicio no es válida.");

    let terminaEn: string | null = null;
    if (tipo === "programada" || fin) {
      if (!fin) return setFallo("Una promoción programada necesita fecha final.");
      terminaEn = fechaLocalABogota(fin);
      if (!terminaEn) return setFallo("La fecha final no es válida.");
      if (new Date(terminaEn) <= new Date(iniciaEn)) {
        return setFallo("La fecha final debe ser posterior a la fecha de inicio.");
      }
    }

    const entrada: EntradaPromocion = {
      productoId,
      precioPromocional: numeroPrecio,
      tipo,
      iniciaEn,
      terminaEn: tipo === "manual" && !terminaEn ? null : terminaEn,
    };

    setGuardando(true);
    try {
      if (editando) await actualizarPromocion(editando.id, entrada);
      else await crearPromocion(entrada);
      setRefresco((n) => n + 1);
      setAviso(editando ? "Promoción actualizada." : "Promoción creada.");
      limpiar();
    } catch (problema) {
      setFallo(problema instanceof Error ? problema.message : String(problema));
    } finally {
      setGuardando(false);
    }
  }

  async function terminar(fila: FilaPromocionAdmin) {
    if (!window.confirm(`¿Terminar la promoción de ${fila.producto}? Queda en el historial.`)) return;
    setFallo(null);
    setAviso(null);
    try {
      await finalizarPromocion(fila.id);
      setRefresco((n) => n + 1);
      setAviso("Promoción terminada. El catálogo vuelve al precio normal.");
      if (editando?.id === fila.id) limpiar();
    } catch (problema) {
      setFallo(problema instanceof Error ? problema.message : String(problema));
    }
  }

  return (
    <>
      <header className="rt-encabezado-pagina">
        <p className="rt-etiqueta">Catálogo</p>
        <h1>Promociones</h1>
        <p className="rt-tenue">
          Un producto puede tener una sola promoción vigente y el precio promocional siempre debe
          quedar por debajo del normal. Al vencer, el catálogo vuelve solo al precio de lista y la
          promoción queda en el historial. Horas en Bogotá.
        </p>
      </header>

      <div className="rt-panel-dos-columnas">
        <form className="rt-caja-formulario" onSubmit={guardar}>
          <h2>{editando ? "Editar promoción" : "Nueva promoción"}</h2>

          <label>
            <span>Producto</span>
            <select
              value={productoId}
              onChange={(e) => setProductoId(e.target.value)}
              disabled={Boolean(editando) || productos.cargando}
              required
            >
              <option value="">Elige un producto…</option>
              {opciones.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.etiqueta}
                </option>
              ))}
            </select>
          </label>

          {seleccionado && (
            <p className="rt-tenue">
              Precio normal: <strong>{formatearPrecio(seleccionado.precioNormal)}</strong>
            </p>
          )}

          <label>
            <span>Precio promocional</span>
            <input
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              placeholder="Ej. 165000"
              required
            />
          </label>

          {seleccionado && numeroPrecio >= seleccionado.precioNormal && (
            <p className="rt-error" role="alert">
              El precio promocional debe ser menor que el normal.
            </p>
          )}
          {descuento !== null && (
            <p className="rt-tenue">
              Queda un descuento del <strong>{descuento} %</strong>.
            </p>
          )}

          <label>
            <span>Tipo</span>
            <select value={tipo} onChange={(e) => setTipo(e.target.value as "manual" | "programada")}>
              <option value="manual">Manual — sin fecha final</option>
              <option value="programada">Programada — con fecha final</option>
            </select>
          </label>

          <div className="rt-rejilla-campos">
            {tipo === "programada" || editando ? (
              <label>
                <span>Inicio</span>
                <input
                  type="datetime-local"
                  value={inicio}
                  onChange={(e) => setInicio(e.target.value)}
                  required
                />
              </label>
            ) : (
              <p className="rt-tenue">Empieza en cuanto la crees.</p>
            )}

            <label>
              <span>Fin {tipo === "programada" ? "" : "(opcional)"}</span>
              <input type="datetime-local" value={fin} onChange={(e) => setFin(e.target.value)} />
            </label>
          </div>

          <p className="rt-tenue">
            Sin fecha final, la promoción sigue hasta que la termines y bloquea programar otra
            encima. Ponle una fecha si quieres dejar la siguiente preparada.
          </p>

          {fallo && (
            <p className="rt-error" role="alert">
              {fallo}
            </p>
          )}
          {aviso && <p className="rt-aviso" role="status">{aviso}</p>}

          <div className="rt-acciones-formulario">
            <button type="submit" className="rt-boton rt-boton--primario" disabled={guardando}>
              {guardando ? "Guardando…" : editando ? "Guardar cambios" : "Crear promoción"}
            </button>
            {editando && (
              <button type="button" className="rt-boton rt-boton--secundario" onClick={limpiar}>
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div>
          {promociones.error && (
            <p className="rt-error" role="alert">
              No se pudieron cargar las promociones: {promociones.error.message}
            </p>
          )}

          {promociones.cargando ? (
            <div className="rt-esqueleto rt-esqueleto--tabla" />
          ) : lista.length === 0 ? (
            <div className="rt-vacio">
              Todavía no hay promociones. El catálogo muestra el precio normal de cada producto.
            </div>
          ) : (
            <div className="rt-tabla-envoltura">
              <table className="rt-tabla rt-tabla--compacta">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className="rt-num">Normal</th>
                    <th className="rt-num">Promoción</th>
                    <th>Vigencia</th>
                    <th>Estado</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {lista.map((p) => (
                    <tr key={p.id}>
                      <td>{p.producto}</td>
                      <td className="rt-num">{formatearPrecio(p.precioNormal)}</td>
                      <td className="rt-num">
                        {formatearPrecio(p.precioPromocional)}
                        {(() => {
                          const d = calcularDescuento(p.precioNormal, p.precioPromocional);
                          return d !== null ? <span className="rt-tenue"> · −{d} %</span> : null;
                        })()}
                      </td>
                      <td>
                        <span className="rt-tenue">{formatearFecha(p.iniciaEn)}</span>
                        <br />
                        <span className="rt-tenue">{formatearFecha(p.terminaEn)}</span>
                      </td>
                      <td>
                        <span className={`rt-chip rt-chip--${p.estado}`}>
                          {ETIQUETA_ESTADO[p.estado]}
                        </span>
                      </td>
                      <td>
                        {p.estado !== "terminada" && (
                          <button type="button" className="rt-enlace-boton" onClick={() => editar(p)}>
                            Editar
                          </button>
                        )}{" "}
                        {(p.estado === "vigente" || p.estado === "programada") && (
                          <button type="button" className="rt-enlace-boton" onClick={() => terminar(p)}>
                            Terminar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
