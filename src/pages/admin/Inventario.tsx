import { useEffect, useMemo, useState } from "react";
import { opcionesProductos, type OpcionProducto } from "../../lib/admin";
import {
  ajustarInventario,
  listarMovimientos,
  type MovimientoVista,
  type TipoMovimiento,
} from "../../lib/mutaciones";
import { useConsulta } from "../../lib/useConsulta";

const TIPOS: { valor: TipoMovimiento; texto: string }[] = [
  { valor: "entrada", texto: "Entrada de mercancía" },
  { valor: "venta", texto: "Venta" },
  { valor: "devolucion", texto: "Devolución" },
  { valor: "ajuste", texto: "Ajuste por error" },
];

/**
 * §7 — inventario por talla con cantidad exacta y historial.
 * Cada cambio guarda cantidad anterior, nueva, motivo y responsable.
 * Si las existencias no alcanzan, aquí se avisa; no se corrige en silencio.
 */
export function Inventario() {
  const [productoId, setProductoId] = useState("");
  const [nuevas, setNuevas] = useState<Record<string, string>>({});
  const [tipo, setTipo] = useState<TipoMovimiento>("entrada");
  const [motivo, setMotivo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
  const [refresco, setRefresco] = useState(0);

  const productos = useConsulta(() => opcionesProductos(), [refresco]);
  const movimientos = useConsulta(
    () => (productoId ? listarMovimientos(productoId) : Promise.resolve([] as MovimientoVista[])),
    [productoId, refresco],
  );

  const seleccionado: OpcionProducto | undefined = useMemo(
    () => (productos.datos ?? []).find((p) => p.id === productoId),
    [productos.datos, productoId],
  );

  useEffect(() => {
    setNuevas({});
    setFallo(null);
  }, [productoId]);

  async function aplicar() {
    if (!seleccionado) return;
    setFallo(null);

    const cambios = seleccionado.tallas
      .map((t) => {
        const escrito = nuevas[t.talla];
        if (escrito === undefined || escrito === "") return null;
        const cantidad = Number(escrito);
        if (Number.isNaN(cantidad) || cantidad < 0) return null;
        if (cantidad === t.cantidad) return null;
        return { talla: t.talla, anterior: t.cantidad, nueva: cantidad };
      })
      .filter((c): c is { talla: string; anterior: number; nueva: number } => c !== null);

    if (cambios.length === 0) {
      setFallo("No hay cantidades modificadas.");
      return;
    }
    if (tipo === "ajuste" && !motivo.trim()) {
      setFallo("Un ajuste necesita motivo.");
      return;
    }

    setGuardando(true);
    try {
      for (const cambio of cambios) {
        await ajustarInventario({
          productoId: seleccionado.id,
          talla: cambio.talla,
          cantidadAnterior: cambio.anterior,
          cantidadNueva: cambio.nueva,
          tipo,
          motivo,
        });
      }
      setNuevas({});
      setMotivo("");
      setRefresco((n) => n + 1);
    } catch (problema) {
      setFallo(problema instanceof Error ? problema.message : String(problema));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <header className="rt-encabezado-pagina">
        <p className="rt-etiqueta">Catálogo</p>
        <h1>Inventario</h1>
        <p className="rt-tenue">
          Actualiza cantidades por talla. Cada cambio queda en el historial con su motivo.
        </p>
      </header>

      <div className="rt-caja-formulario">
        <label>
          <span>Producto</span>
          <select value={productoId} onChange={(e) => setProductoId(e.target.value)}>
            <option value="">Selecciona un producto…</option>
            {(productos.datos ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.etiqueta} · {p.existencias} u.
              </option>
            ))}
          </select>
        </label>

        {productos.datos?.length === 0 && (
          <p className="rt-nota-pendiente">
            No hay productos todavía. Crea uno en Productos para poder cargar inventario.
          </p>
        )}
      </div>

      {seleccionado && (
        <section className="rt-caja-formulario">
          <h2>Tallas de {seleccionado.etiqueta}</h2>

          <div className="rt-rejilla-campos">
            <label>
              <span>Motivo del movimiento</span>
              <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoMovimiento)}>
                {TIPOS.map((t) => (
                  <option key={t.valor} value={t.valor}>
                    {t.texto}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Nota {tipo === "ajuste" ? "(obligatoria)" : "(opcional)"}</span>
              <input
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej. Llegó pedido del proveedor"
              />
            </label>
          </div>

          {seleccionado.tallas.length === 0 ? (
            <p className="rt-tenue">Este producto no tiene tallas registradas.</p>
          ) : (
            <div className="rt-tabla-envoltura">
              <table className="rt-tabla rt-tabla--compacta">
                <thead>
                  <tr>
                    <th>Talla</th>
                    <th className="rt-num">Actual</th>
                    <th className="rt-num">Nueva cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {seleccionado.tallas.map((t) => (
                    <tr key={t.talla}>
                      <td>{t.talla}</td>
                      <td className="rt-num">{t.cantidad}</td>
                      <td className="rt-num">
                        <input
                          className="rt-input-compacto"
                          type="number"
                          min={0}
                          step={1}
                          value={nuevas[t.talla] ?? ""}
                          onChange={(e) =>
                            setNuevas((n) => ({ ...n, [t.talla]: e.target.value }))
                          }
                          placeholder="—"
                          aria-label={`Nueva cantidad para talla ${t.talla}`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {fallo && (
            <p className="rt-error" role="alert">
              {fallo}
            </p>
          )}

          <div className="rt-acciones-formulario">
            <button
              type="button"
              className="rt-boton rt-boton--primario"
              onClick={aplicar}
              disabled={guardando}
            >
              {guardando ? "Guardando…" : "Aplicar cambios"}
            </button>
          </div>
        </section>
      )}

      {productoId && (
        <section className="rt-caja-formulario">
          <h2>Historial reciente</h2>
          {movimientos.cargando ? (
            <div className="rt-esqueleto rt-esqueleto--tabla" />
          ) : (movimientos.datos ?? []).length === 0 ? (
            <p className="rt-tenue">Sin movimientos registrados todavía.</p>
          ) : (
            <div className="rt-tabla-envoltura">
              <table className="rt-tabla rt-tabla--compacta">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Talla</th>
                    <th className="rt-num">Antes</th>
                    <th className="rt-num">Después</th>
                    <th>Tipo</th>
                    <th>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {(movimientos.datos ?? []).map((m) => (
                    <tr key={m.id}>
                      <td className="rt-mono">
                        {new Date(m.creado).toLocaleString("es-CO", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td>{m.talla}</td>
                      <td className="rt-num">{m.cantidadAnterior}</td>
                      <td className="rt-num">{m.cantidadNueva}</td>
                      <td>{m.tipo}</td>
                      <td>{m.motivo ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </>
  );
}
