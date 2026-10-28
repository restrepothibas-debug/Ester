import { useMemo, useRef, useState } from "react";
import { opcionesProductos, type OpcionProducto } from "../../lib/admin";
import {
  asignarFoto,
  descartarFoto,
  listarBandeja,
  listarFotosProducto,
  marcarPrincipal,
  moverImagen,
  quitarImagen,
  subirFoto,
  urlPublica,
  type FotoBandeja,
} from "../../lib/fotos";
import { useConsulta } from "../../lib/useConsulta";

/**
 * §6 y punto 52 — fotografías del producto.
 *
 * Tres bloques, en el orden en que se trabaja:
 *   1. Subir: la foto se reduce en el navegador y se sube ya optimizada.
 *   2. Bandeja: lo que llegó y todavía no tiene producto.
 *   3. Por producto: elegir la principal y ordenar.
 *
 * Nada se publica solo: una foto entra en la bandeja y alguien la asigna.
 */
export function Fotos() {
  const [refresco, setRefresco] = useState(0);
  const [fallo, setFallo] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [registroSubida, setRegistroSubida] = useState<string[]>([]);
  const [elegido, setElegido] = useState("");
  const [productoFotos, setProductoFotos] = useState("");
  const [destino, setDestino] = useState<Record<string, string>>({});
  const [ocupado, setOcupado] = useState(false);
  const entradaArchivos = useRef<HTMLInputElement>(null);

  const productos = useConsulta(() => opcionesProductos(), []);
  const bandeja = useConsulta(() => listarBandeja(), [refresco]);
  const fotos = useConsulta(
    () => (productoFotos ? listarFotosProducto(productoFotos) : Promise.resolve([])),
    [productoFotos, refresco],
  );

  const opciones: OpcionProducto[] = useMemo(() => productos.datos ?? [], [productos.datos]);
  const porId = useMemo(() => new Map(opciones.map((p) => [p.id, p])), [opciones]);

  function refrescar(mensaje?: string) {
    setRefresco((n) => n + 1);
    if (mensaje) {
      setAviso(mensaje);
      setFallo(null);
    }
  }

  async function subir(lista: FileList | File[]) {
    const archivos = [...lista];
    if (archivos.length === 0) return;

    setSubiendo(true);
    setFallo(null);
    setAviso(null);
    setRegistroSubida([]);

    const lineas: string[] = [];
    let nuevas = 0;
    let repetidas = 0;

    for (const archivo of archivos) {
      try {
        const resultado = await subirFoto(archivo);
        if (resultado.nueva) {
          nuevas += 1;
          lineas.push(`✔ ${archivo.name}`);
        } else {
          repetidas += 1;
          lineas.push(`· ${archivo.name} — ya estaba`);
        }
      } catch (error) {
        lineas.push(`✘ ${archivo.name} — ${(error as Error).message}`);
      }
      setRegistroSubida([...lineas]);
    }

    setSubiendo(false);
    setRegistroSubida([...lineas]);
    if (nuevas > 0 || repetidas > 0) {
      refrescar(`${nuevas} foto(s) nueva(s), ${repetidas} repetida(s).`);
    }
    if (entradaArchivos.current) entradaArchivos.current.value = "";
  }

  async function asignar(foto: FotoBandeja) {
    const productoId = destino[foto.id] ?? elegido;
    if (!productoId) {
      setFallo("Elige un producto antes de asignar la foto.");
      return;
    }
    setOcupado(true);
    try {
      await asignarFoto(foto.id, productoId);
      refrescar("Foto asignada al producto.");
    } catch (error) {
      setFallo((error as Error).message);
    } finally {
      setOcupado(false);
    }
  }

  async function descartar(foto: FotoBandeja) {
    setOcupado(true);
    try {
      await descartarFoto(foto);
      refrescar("Foto descartada.");
    } catch (error) {
      setFallo((error as Error).message);
    } finally {
      setOcupado(false);
    }
  }

  async function accion(tarea: () => Promise<void>, mensaje: string) {
    setOcupado(true);
    try {
      await tarea();
      refrescar(mensaje);
    } catch (error) {
      setFallo((error as Error).message);
    } finally {
      setOcupado(false);
    }
  }

  const totalBandeja = bandeja.datos?.length ?? 0;

  return (
    <>
      <header className="rt-encabezado-pagina">
        <p className="rt-etiqueta">Catálogo</p>
        <h1>Fotografías</h1>
        <p className="rt-tenue">
          Las fotos se reducen aquí mismo antes de subirlas: se guardan en WebP de 1600 px y con
          una miniatura de 480 px para las tarjetas del catálogo.
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

      <section className="rt-seccion-panel">
        <h2>Subir fotos</h2>
        <p className="rt-tenue">
          Puedes traerlas del procesador local (<code>fotos/grandes</code>) o directamente del
          móvil. Se aceptan JPEG, PNG y WebP de hasta 25 MB.
        </p>

        <label className="rt-soltar">
          <input
            ref={entradaArchivos}
            type="file"
            accept="image/*"
            multiple
            disabled={subiendo}
            onChange={(e) => {
              if (e.target.files) void subir(e.target.files);
            }}
          />
          <span>{subiendo ? "Subiendo…" : "Elegir fotos o arrastrarlas aquí"}</span>
        </label>

        {registroSubida.length > 0 && (
          <ul className="rt-registro" aria-live="polite">
            {registroSubida.map((linea, i) => (
              <li key={i}>{linea}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="rt-seccion-panel">
        <h2>Sin asignar {totalBandeja > 0 && <span className="rt-num rt-tenue">({totalBandeja})</span>}</h2>

        {bandeja.error && <p className="rt-error">{bandeja.error.message}</p>}
        {bandeja.cargando && <div className="rt-esqueleto rt-esqueleto--tabla" />}

        {!bandeja.cargando && totalBandeja === 0 && (
          <p className="rt-vacio">
            No hay fotos esperando. Sube algunas o procésalas desde la exportación de WhatsApp.
          </p>
        )}

        {totalBandeja > 0 && (
          <>
            <div className="rt-fila-formulario">
              <label htmlFor="producto-comun">Asignar todas a</label>
              <select
                id="producto-comun"
                value={elegido}
                onChange={(e) => setElegido(e.target.value)}
              >
                <option value="">— elegir producto —</option>
                {opciones.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.etiqueta}
                  </option>
                ))}
              </select>
            </div>

            <ul className="rt-fotos">
              {(bandeja.datos ?? []).map((foto) => {
                const url = urlPublica(foto.ruta_min) ?? urlPublica(foto.ruta);
                return (
                  <li key={foto.id} className="rt-foto">
                    <div className="rt-foto__marco">
                      {url ? <img src={url} alt="" loading="lazy" /> : <span>Sin vista</span>}
                    </div>
                    <p className="rt-foto__datos rt-tenue">
                      {foto.ancho ?? "?"}×{foto.alto ?? "?"} ·{" "}
                      {foto.bytes ? `${Math.round(foto.bytes / 1024)} kB` : "—"}
                    </p>
                    <select
                      aria-label="Producto de esta foto"
                      value={destino[foto.id] ?? ""}
                      onChange={(e) =>
                        setDestino((previo) => ({ ...previo, [foto.id]: e.target.value }))
                      }
                    >
                      <option value="">— producto —</option>
                      {opciones.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.etiqueta}
                        </option>
                      ))}
                    </select>
                    <div className="rt-acciones-fila">
                      <button
                        type="button"
                        className="rt-boton rt-boton--primario"
                        disabled={ocupado}
                        onClick={() => void asignar(foto)}
                      >
                        Asignar
                      </button>
                      <button
                        type="button"
                        className="rt-boton"
                        disabled={ocupado}
                        onClick={() => void descartar(foto)}
                      >
                        Descartar
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      <section className="rt-seccion-panel">
        <h2>Fotos de un producto</h2>
        <div className="rt-fila-formulario">
          <label htmlFor="producto-fotos">Producto</label>
          <select
            id="producto-fotos"
            value={productoFotos}
            onChange={(e) => setProductoFotos(e.target.value)}
          >
            <option value="">— elegir producto —</option>
            {opciones.map((p) => (
              <option key={p.id} value={p.id}>
                {p.etiqueta}
              </option>
            ))}
          </select>
        </div>

        {!productoFotos && <p className="rt-vacio">Elige un producto para ver y ordenar sus fotos.</p>}

        {productoFotos && fotos.cargando && <div className="rt-esqueleto rt-esqueleto--tabla" />}

        {productoFotos && !fotos.cargando && (fotos.datos?.length ?? 0) === 0 && (
          <p className="rt-vacio">Este producto todavía no tiene fotos.</p>
        )}

        {(fotos.datos?.length ?? 0) > 0 && (
          <ul className="rt-fotos">
            {(fotos.datos ?? []).map((foto) => {
              const url = urlPublica(foto.ruta_min) ?? urlPublica(foto.ruta);
              return (
                <li key={foto.id} className="rt-foto">
                  <div className="rt-foto__marco">
                    {url ? <img src={url} alt="" loading="lazy" /> : <span>Sin vista</span>}
                    {foto.principal && <span className="rt-foto__sello">Principal</span>}
                  </div>
                  <p className="rt-foto__datos rt-tenue">
                    {porId.get(productoFotos)?.codigo ?? ""} · posición {foto.orden + 1}
                  </p>
                  <div className="rt-acciones-fila">
                    <button
                      type="button"
                      className="rt-boton"
                      disabled={ocupado || foto.principal}
                      onClick={() => void accion(() => marcarPrincipal(foto.id), "Foto principal actualizada.")}
                    >
                      Principal
                    </button>
                    <button
                      type="button"
                      className="rt-boton"
                      disabled={ocupado}
                      aria-label="Subir"
                      onClick={() => void accion(() => moverImagen(foto.id, -1), "Orden actualizado.")}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="rt-boton"
                      disabled={ocupado}
                      aria-label="Bajar"
                      onClick={() => void accion(() => moverImagen(foto.id, 1), "Orden actualizado.")}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="rt-boton"
                      disabled={ocupado}
                      onClick={() => void accion(() => quitarImagen(foto), "Foto quitada del producto.")}
                    >
                      Quitar
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
