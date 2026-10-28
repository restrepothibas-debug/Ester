import { useState } from "react";
import {
  listarSeleccionesAdmin,
  opcionesProductos,
  type FilaSeleccionAdmin,
  type TipoSeleccion,
} from "../../lib/admin";
import { agregarSeleccion, moverSeleccion, quitarSeleccion } from "../../lib/mutaciones";
import { useConsulta } from "../../lib/useConsulta";

/** Cuántos muestra el inicio de cada sección (`Inicio.tsx`). */
const VISIBLES: Record<TipoSeleccion, number> = { destacado: 8, oferta_semana: 4 };

const SECCIONES: { tipo: TipoSeleccion; titulo: string; ayuda: string }[] = [
  {
    tipo: "oferta_semana",
    titulo: "Oferta de la semana",
    ayuda:
      "Lo que se ve en el bloque «Ofertas de la semana» del inicio. Es una selección, no una promoción: no cambia el precio. Si quieres rebajar el precio, crea una promoción.",
  },
  {
    tipo: "destacado",
    titulo: "Destacados",
    ayuda: "Lo que se ve en el bloque «Destacados» del inicio, en el orden de esta lista.",
  },
];

/**
 * Punto 54 — el administrador elige y ordena a mano.
 *
 * No hay regla automática de «lo más vendido»: la selección es una decisión.
 * Solo se ofrecen productos publicados o agotados, porque un borrador no se
 * puede mostrar en el catálogo.
 */
export function Destacados() {
  const [refresco, setRefresco] = useState(0);
  const [fallo, setFallo] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  return (
    <>
      <header className="rt-encabezado-pagina">
        <p className="rt-etiqueta">Catálogo</p>
        <h1>Destacados y oferta de la semana</h1>
        <p className="rt-tenue">
          Se eligen a mano y en el orden que pongas aquí. No cambian precios: para rebajar un
          producto hace falta una promoción.
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

      {SECCIONES.map((seccion) => (
        <Seccion
          key={`${seccion.tipo}-${refresco}`}
          {...seccion}
          onError={setFallo}
          onAviso={setAviso}
          onCambio={() => setRefresco((n) => n + 1)}
        />
      ))}
    </>
  );
}

function Seccion({
  tipo,
  titulo,
  ayuda,
  onError,
  onAviso,
  onCambio,
}: {
  tipo: TipoSeleccion;
  titulo: string;
  ayuda: string;
  onError: (mensaje: string | null) => void;
  onAviso: (mensaje: string | null) => void;
  onCambio: () => void;
}) {
  const [refresco, setRefresco] = useState(0);
  const seleccion = useConsulta(() => listarSeleccionesAdmin(tipo), [refresco]);
  const productos = useConsulta(() => opcionesProductos(), []);
  const [elegido, setElegido] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const filas = seleccion.datos ?? [];
  const yaElegidos = new Set(filas.map((f) => f.productoId));
  const disponibles = (productos.datos ?? []).filter(
    (p) => (p.estado === "publicado" || p.estado === "agotado") && !yaElegidos.has(p.id),
  );

  function recargar() {
    setRefresco((n) => n + 1);
    onCambio();
  }

  async function ejecutar(accion: () => Promise<void>, mensaje: string) {
    onError(null);
    onAviso(null);
    setOcupado(true);
    try {
      await accion();
      recargar();
      onAviso(mensaje);
    } catch (problema) {
      onError(problema instanceof Error ? problema.message : String(problema));
    } finally {
      setOcupado(false);
    }
  }

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    if (!elegido) return onError("Elige un producto para añadirlo.");
    await ejecutar(async () => {
      await agregarSeleccion(elegido, tipo);
      setElegido("");
    }, "Producto añadido al final de la selección.");
  }

  return (
    <section className="rt-seccion-panel">
      <header className="rt-encabezado-pagina">
        <h2>{titulo}</h2>
        <p className="rt-tenue">{ayuda}</p>
      </header>

      <form className="rt-fila-formulario" onSubmit={agregar}>
        <label className="rt-crece">
          <span>Producto</span>
          <select
            value={elegido}
            onChange={(e) => setElegido(e.target.value)}
            disabled={productos.cargando || disponibles.length === 0}
          >
            <option value="">
              {disponibles.length === 0
                ? "No quedan productos publicados por añadir"
                : "Elige un producto…"}
            </option>
            {disponibles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.etiqueta}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rt-boton rt-boton--primario"
          disabled={ocupado || !elegido}
        >
          Añadir
        </button>
      </form>

      {productos.error && (
        <p className="rt-error" role="alert">
          No se pudo cargar la lista de productos: {productos.error.message}
        </p>
      )}

      {seleccion.error ? (
        <p className="rt-error" role="alert">
          No se pudo cargar la selección: {seleccion.error.message}
        </p>
      ) : seleccion.cargando ? (
        <div className="rt-esqueleto rt-esqueleto--tabla" />
      ) : filas.length === 0 ? (
        <div className="rt-vacio">Todavía no hay nada en «{titulo}».</div>
      ) : (
        <>
          <div className="rt-tabla-envoltura">
            <table className="rt-tabla rt-tabla--compacta">
              <thead>
                <tr>
                  <th className="rt-num">#</th>
                  <th>Producto</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filas.map((fila, indice) => (
                  <Fila
                    key={fila.id}
                    fila={fila}
                    indice={indice}
                    total={filas.length}
                    tipo={tipo}
                    ocupado={ocupado}
                    onError={onError}
                    onAviso={onAviso}
                    onCambio={recargar}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {filas.length > VISIBLES[tipo] && (
            <p className="rt-tenue">
              El inicio solo muestra {VISIBLES[tipo]}. Las {filas.length - VISIBLES[tipo]} últimas no
              se verán hasta que quites alguna o las subas.
            </p>
          )}
        </>
      )}
    </section>
  );
}

function Fila({
  fila,
  indice,
  total,
  tipo,
  ocupado,
  onError,
  onAviso,
  onCambio,
}: {
  fila: FilaSeleccionAdmin;
  indice: number;
  total: number;
  tipo: TipoSeleccion;
  ocupado: boolean;
  onError: (mensaje: string | null) => void;
  onAviso: (mensaje: string | null) => void;
  onCambio: () => void;
}) {
  const [yendo, setYendo] = useState(false);

  async function mover(direccion: -1 | 1) {
    onError(null);
    onAviso(null);
    setYendo(true);
    try {
      await moverSeleccion(tipo, fila.id, direccion);
      onCambio();
      onAviso("Orden actualizado.");
    } catch (problema) {
      onError(problema instanceof Error ? problema.message : String(problema));
    } finally {
      setYendo(false);
    }
  }

  async function quitar() {
    onError(null);
    onAviso(null);
    setYendo(true);
    try {
      await quitarSeleccion(fila.id);
      onCambio();
      onAviso("Producto quitado de la selección.");
    } catch (problema) {
      onError(problema instanceof Error ? problema.message : String(problema));
    } finally {
      setYendo(false);
    }
  }

  return (
    <tr>
      <td className="rt-num rt-tenue">{indice + 1}</td>
      <td>{fila.producto}</td>
      <td>
        <span className={`rt-chip ${fila.estado === "agotado" ? "rt-chip--agotado" : "rt-chip--publicado"}`}>
          {fila.estado === "agotado" ? "Agotado" : "Publicado"}
        </span>
      </td>
      <td className="rt-acciones-fila">
        <button
          type="button"
          className="rt-enlace-boton"
          onClick={() => mover(-1)}
          disabled={ocupado || yendo || indice === 0}
          aria-label={`Subir ${fila.producto}`}
        >
          Subir
        </button>
        <button
          type="button"
          className="rt-enlace-boton"
          onClick={() => mover(1)}
          disabled={ocupado || yendo || indice === total - 1}
          aria-label={`Bajar ${fila.producto}`}
        >
          Bajar
        </button>
        <button type="button" className="rt-enlace-boton" onClick={quitar} disabled={ocupado || yendo}>
          Quitar
        </button>
      </td>
    </tr>
  );
}
