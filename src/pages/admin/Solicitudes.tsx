import { useState } from "react";
import {
  listarSolicitudesAdmin,
  opcionesProductos,
  type FilaSolicitudAdmin,
} from "../../lib/admin";
import {
  cancelarSolicitud,
  confirmarSolicitud,
  crearSolicitud,
  eliminarSolicitud,
} from "../../lib/mutaciones";
import { useConsulta } from "../../lib/useConsulta";
import { formatearPrecio } from "../../lib/formato";
import { formatearFecha } from "../../lib/fechas";
import { ETIQUETA_SOLICITUD, type EstadoSolicitud } from "../../types/domain";

const ESTADOS: (EstadoSolicitud | "todas")[] = ["todas", "pendiente", "confirmada", "cancelada"];

/**
 * Puntos 57–61 — solicitudes de WhatsApp.
 *
 * El cliente escribe por WhatsApp; aquí se registra a mano lo que pidió. Abrir
 * WhatsApp no crea nada ni descuenta inventario: eso solo pasa al confirmar, y
 * lo decide el administrador (punto 60). Si no hay existencias, se confirma sin
 * descontar o se cancela (punto 61).
 */
export function Solicitudes() {
  const [estado, setEstado] = useState<EstadoSolicitud | "todas">("pendiente");
  const [refresco, setRefresco] = useState(0);
  const consulta = useConsulta(() => listarSolicitudesAdmin(estado), [estado, refresco]);
  // Se relee tras cada acción: si no, el formulario enseña existencias viejas.
  const productos = useConsulta(() => opcionesProductos(), [refresco]);
  const [fallo, setFallo] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const filas = consulta.datos ?? [];

  function refrescar(mensaje: string) {
    setAviso(mensaje);
    setRefresco((n) => n + 1);
  }

  return (
    <>
      <header className="rt-encabezado-pagina">
        <p className="rt-etiqueta">Ventas</p>
        <h1>Solicitudes</h1>
        <p className="rt-tenue">
          Lo que el cliente pide por WhatsApp se registra aquí a mano. Abrir WhatsApp no crea la
          solicitud ni descuenta inventario: eso ocurre al confirmar, cuando tú decides.
        </p>
      </header>

      {fallo && (
        <p className="rt-error" role="alert">
          {fallo}
        </p>
      )}
      {aviso && (
        <p className="rt-aviso" role="status">
          {aviso}
        </p>
      )}

      <Formulario
        // La clave fuerza a releer tallas y precios cuando cambia el inventario.
        key={`formulario-${refresco}`}
        productos={productos.datos ?? []}
        cargando={productos.cargando}
        error={productos.error}
        onError={setFallo}
        onCreada={() => refrescar("Solicitud registrada.")}
      />

      <section className="rt-seccion-panel">
        <div className="rt-fila-formulario rt-fila-formulario--filtro">
          <label className="rt-filtro-linea">
            <span>Ver</span>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as EstadoSolicitud | "todas")}
            >
              {ESTADOS.map((e) => (
                <option key={e} value={e}>
                  {e === "todas" ? "Todas" : ETIQUETA_SOLICITUD[e]}
                </option>
              ))}
            </select>
          </label>
        </div>

        {consulta.error ? (
          <p className="rt-error" role="alert">
            No se pudieron cargar las solicitudes: {consulta.error.message}
          </p>
        ) : consulta.cargando ? (
          <div className="rt-esqueleto rt-esqueleto--tabla" />
        ) : filas.length === 0 ? (
          <div className="rt-vacio">
            {estado === "todas"
              ? "Todavía no hay solicitudes registradas."
              : `No hay solicitudes en estado «${ETIQUETA_SOLICITUD[estado as EstadoSolicitud]}».`}
          </div>
        ) : (
          <div className="rt-tabla-envoltura">
            <table className="rt-tabla rt-tabla--compacta">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Producto</th>
                  <th>Talla</th>
                  <th className="rt-num">Precio</th>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filas.map((fila) => (
                  <Fila
                    key={fila.id}
                    fila={fila}
                    onError={(m) => {
                      setAviso(null);
                      setFallo(m);
                    }}
                    onHecho={refrescar}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function Formulario({
  productos,
  cargando,
  error,
  onError,
  onCreada,
}: {
  productos: {
    id: string;
    codigo: string;
    etiqueta: string;
    precioVigente: number;
    tallas: { talla: string; cantidad: number }[];
  }[];
  cargando: boolean;
  error: Error | null;
  onError: (mensaje: string | null) => void;
  onCreada: () => void;
}) {
  const [productoId, setProductoId] = useState("");
  const [talla, setTalla] = useState("");
  const [precio, setPrecio] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [guardando, setGuardando] = useState(false);

  const producto = productos.find((p) => p.id === productoId) ?? null;

  function elegir(id: string) {
    setProductoId(id);
    const elegido = productos.find((p) => p.id === id);
    setTalla("");
    setPrecio(elegido ? String(elegido.precioVigente) : "");
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    onError(null);
    if (!producto) return onError("Elige el producto.");
    if (!talla.trim()) return onError("Elige la talla.");

    setGuardando(true);
    try {
      await crearSolicitud({
        productoId: producto.id,
        referencia: producto.codigo,
        talla: talla.trim(),
        precio: Number(precio),
        clienteNombre: nombre,
        clienteTelefono: telefono,
        observaciones: observaciones || null,
      });
      setNombre("");
      setTelefono("");
      setObservaciones("");
      setTalla("");
      onCreada();
    } catch (problema) {
      onError(problema instanceof Error ? problema.message : String(problema));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className="rt-caja-formulario" onSubmit={guardar}>
      <h2>Registrar una solicitud</h2>

      <label>
        <span>Producto</span>
        <select value={productoId} onChange={(e) => elegir(e.target.value)} disabled={cargando} required>
          <option value="">Elige un producto…</option>
          {productos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.etiqueta}
            </option>
          ))}
        </select>
      </label>

      {error && (
        <p className="rt-error" role="alert">
          No se pudo cargar la lista de productos: {error.message}
        </p>
      )}

      <div className="rt-rejilla-campos">
        <label>
          <span>Talla</span>
          {producto && producto.tallas.length > 0 ? (
            <select value={talla} onChange={(e) => setTalla(e.target.value)} required>
              <option value="">Elige la talla…</option>
              {producto.tallas.map((t) => (
                <option key={t.talla} value={t.talla}>
                  {t.talla} — {t.cantidad} disponibles
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={talla}
              onChange={(e) => setTalla(e.target.value)}
              placeholder="Ej. 38"
              required
            />
          )}
        </label>

        <label>
          <span>Precio acordado</span>
          <input
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            required
          />
        </label>
      </div>

      {producto && (
        <p className="rt-tenue">
          Precio normal {formatearPrecio(producto.precioVigente)}. Se guarda una copia: si el precio
          cambia después, la solicitud conserva este.
        </p>
      )}

      <div className="rt-rejilla-campos">
        <label>
          <span>Nombre del cliente</span>
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </label>
        <label>
          <span>Teléfono</span>
          <input
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="Ej. 300 123 4567"
            required
          />
        </label>
      </div>

      <label>
        <span>Observaciones (opcional)</span>
        <input
          type="text"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder="Ej. pregunta por otro color"
        />
      </label>

      <div className="rt-acciones-formulario">
        <button type="submit" className="rt-boton rt-boton--primario" disabled={guardando}>
          {guardando ? "Guardando…" : "Registrar solicitud"}
        </button>
      </div>
    </form>
  );
}

function Fila({
  fila,
  onError,
  onHecho,
}: {
  fila: FilaSolicitudAdmin;
  onError: (mensaje: string) => void;
  onHecho: (mensaje: string) => void;
}) {
  const [ocupado, setOcupado] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [devolver, setDevolver] = useState(true);
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);

  async function ejecutar(accion: () => Promise<void>, mensaje: string) {
    onError("");
    setOcupado(true);
    try {
      await accion();
      onHecho(mensaje);
    } catch (problema) {
      onError(problema instanceof Error ? problema.message : String(problema));
    } finally {
      setOcupado(false);
    }
  }

  function confirmar(descontar: boolean) {
    return ejecutar(
      () => confirmarSolicitud(fila.id, descontar),
      descontar
        ? "Solicitud confirmada y una unidad descontada del inventario."
        : "Solicitud confirmada sin tocar el inventario.",
    );
  }

  function cancelar() {
    if (!motivo.trim()) {
      onError("La cancelación necesita un motivo.");
      return;
    }
    void ejecutar(
      () => cancelarSolicitud(fila.id, motivo, devolver && fila.inventarioDescontado),
      devolver && fila.inventarioDescontado
        ? "Solicitud cancelada y unidad devuelta al inventario."
        : "Solicitud cancelada.",
    );
  }

  function eliminar() {
    void ejecutar(() => eliminarSolicitud(fila.id), "Solicitud eliminada.");
  }

  return (
    <>
      <tr>
        <td>
          <span className="rt-tenue">{formatearFecha(fila.creado)}</span>
        </td>
        <td>
          {fila.producto}
          <br />
          <span className="rt-tenue">Ref. {fila.referencia}</span>
        </td>
        <td>{fila.talla}</td>
        <td className="rt-num">{formatearPrecio(fila.precio)}</td>
        <td>
          {fila.cliente}
          <br />
          <span className="rt-tenue">{fila.telefono}</span>
          {fila.observaciones && (
            <>
              <br />
              <span className="rt-tenue">{fila.observaciones}</span>
            </>
          )}
        </td>
        <td>
          <span className={`rt-chip rt-chip--${fila.estado}`}>{ETIQUETA_SOLICITUD[fila.estado]}</span>
          {fila.estado === "confirmada" &&
            (fila.inventarioDescontado ? (
              <>
                <br />
                <span className="rt-tenue">Inventario descontado</span>
              </>
            ) : (
              <>
                <br />
                <span className="rt-tenue">Sin descontar del inventario</span>
              </>
            ))}
          {fila.motivoCancelacion && (
            <>
              <br />
              <span className="rt-tenue">Motivo: {fila.motivoCancelacion}</span>
            </>
          )}
        </td>
        <td className="rt-acciones-fila">
          {fila.estado === "pendiente" && (
            <>
              {fila.existencias > 0 ? (
                <button
                  type="button"
                  className="rt-enlace-boton"
                  onClick={() => confirmar(true)}
                  disabled={ocupado}
                >
                  Confirmar y descontar
                </button>
              ) : (
                <span className="rt-tenue">Sin existencias en esta talla</span>
              )}
              <button
                type="button"
                className="rt-enlace-boton"
                onClick={() => confirmar(false)}
                disabled={ocupado}
              >
                Confirmar sin descontar
              </button>
            </>
          )}
          {(fila.estado === "pendiente" || fila.estado === "confirmada") && !cancelando && (
            <button
              type="button"
              className="rt-enlace-boton"
              onClick={() => {
                setCancelando(true);
                setDevolver(true);
              }}
              disabled={ocupado}
            >
              Cancelar
            </button>
          )}
          {fila.estado === "cancelada" &&
            (confirmandoBorrado ? (
              <>
                <button
                  type="button"
                  className="rt-enlace-boton"
                  onClick={eliminar}
                  disabled={ocupado}
                >
                  Sí, borrar
                </button>
                <button
                  type="button"
                  className="rt-enlace-boton"
                  onClick={() => setConfirmandoBorrado(false)}
                  disabled={ocupado}
                >
                  No
                </button>
              </>
            ) : (
              <button
                type="button"
                className="rt-enlace-boton"
                onClick={() => setConfirmandoBorrado(true)}
                disabled={ocupado}
              >
                Eliminar
              </button>
            ))}
        </td>
      </tr>

      {cancelando && (
        <tr>
          <td colSpan={7}>
            <div className="rt-fila-formulario rt-fila-formulario--filtro">
              <label className="rt-crece">
                <span>Motivo de la cancelación de {fila.cliente}</span>
                <input
                  type="text"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej. no contestó o cambió de talla"
                  autoFocus
                />
              </label>
              {fila.inventarioDescontado && (
                <label className="rt-casilla">
                  <input
                    type="checkbox"
                    checked={devolver}
                    onChange={(e) => setDevolver(e.target.checked)}
                  />
                  <span>Devolver la unidad al inventario</span>
                </label>
              )}
              <button
                type="button"
                className="rt-boton rt-boton--primario"
                onClick={cancelar}
                disabled={ocupado}
              >
                Confirmar cancelación
              </button>
              <button
                type="button"
                className="rt-boton rt-boton--secundario"
                onClick={() => {
                  setCancelando(false);
                  setMotivo("");
                }}
                disabled={ocupado}
              >
                Volver
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
