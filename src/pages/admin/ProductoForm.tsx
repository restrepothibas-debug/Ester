import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { listarMarcasAdmin } from "../../lib/admin";
import {
  actualizarProducto,
  crearProducto,
  obtenerProductoParaEditar,
  type EntradaProducto,
} from "../../lib/mutaciones";
import { ETIQUETA_ESTADO, type EstadoProducto } from "../../types/domain";

const ESTADOS: EstadoProducto[] = [
  "pendiente_revision",
  "borrador",
  "publicado",
  "agotado",
  "archivado",
];

const VACIO: EntradaProducto = {
  codigoInterno: "",
  marcaId: "",
  modelo: "",
  referencia: "",
  color: "",
  precioNormal: 0,
  estado: "pendiente_revision",
  tallas: [{ talla: "", cantidad: 0 }],
};

/**
 * Alta y edición de producto (§6, §7, §9).
 * El precio y las cantidades no se guardan en silencio: dejan historial.
 * Las fotografías llegan en el módulo de imágenes.
 */
export function ProductoForm() {
  const { id } = useParams();
  const navegar = useNavigate();
  const esEdicion = Boolean(id);

  const [form, setForm] = useState<EntradaProducto>(VACIO);
  const [marcas, setMarcas] = useState<{ id: string; nombre: string; activa: boolean }[]>([]);
  const [cargando, setCargando] = useState(esEdicion);
  const [guardando, setGuardando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);

  useEffect(() => {
    listarMarcasAdmin()
      .then((lista) => setMarcas(lista))
      .catch(() => setMarcas([]));
  }, []);

  useEffect(() => {
    if (!id) {
      setCargando(false);
      return;
    }
    obtenerProductoParaEditar(id)
      .then((producto) => {
        if (!producto) {
          setFallo("El producto no existe.");
          return;
        }
        setForm({
          codigoInterno: producto.codigoInterno,
          marcaId: producto.marcaId,
          modelo: producto.modelo,
          referencia: producto.referencia ?? "",
          color: producto.color ?? "",
          precioNormal: Number(producto.precioNormal),
          estado: producto.estado,
          tallas:
            producto.tallas.length > 0
              ? producto.tallas
              : [{ talla: "", cantidad: 0 }],
        });
      })
      .catch((error: unknown) =>
        setFallo(error instanceof Error ? error.message : String(error)),
      )
      .finally(() => setCargando(false));
  }, [id]);

  function campo<K extends keyof EntradaProducto>(clave: K, valor: EntradaProducto[K]) {
    setForm((f) => ({ ...f, [clave]: valor }));
  }

  function tallaEn(indice: number, cambio: Partial<{ talla: string; cantidad: number }>) {
    setForm((f) => ({
      ...f,
      tallas: f.tallas.map((t, i) => (i === indice ? { ...t, ...cambio } : t)),
    }));
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setFallo(null);

    if (!form.codigoInterno.trim()) return setFallo("El código interno es obligatorio.");
    if (!form.marcaId) return setFallo("Elige una marca.");
    if (!form.modelo.trim()) return setFallo("El modelo es obligatorio.");
    if (!(form.precioNormal >= 0)) return setFallo("El precio no puede ser negativo.");

    const tallas = form.tallas.filter((t) => t.talla.trim() !== "");
    if (tallas.some((t) => t.cantidad < 0)) return setFallo("Las cantidades no pueden ser negativas.");

    setGuardando(true);
    try {
      const entrada: EntradaProducto = { ...form, tallas };
      if (esEdicion && id) await actualizarProducto(id, entrada);
      else await crearProducto(entrada);
      navegar("/admin/productos", { replace: true, state: { guardado: true } });
    } catch (problema) {
      setFallo(problema instanceof Error ? problema.message : String(problema));
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return <div className="rt-esqueleto rt-esqueleto--tabla" />;
  }

  return (
    <>
      <nav className="rt-migas">
        <Link to="/admin/productos">Productos</Link>
        <span>/</span>
        <span>{esEdicion ? "Editar" : "Nuevo"}</span>
      </nav>

      <header className="rt-encabezado-pagina">
        <h1>{esEdicion ? "Editar producto" : "Nuevo producto"}</h1>
        <p className="rt-tenue">
          Los cambios de precio y de cantidades quedan registrados con fecha y responsable.
        </p>
      </header>

      <form onSubmit={enviar} className="rt-formulario-producto">
        <section className="rt-caja-formulario">
          <h2>Datos</h2>

          <div className="rt-rejilla-campos">
            <label>
              <span>Código interno *</span>
              <input
                type="text"
                value={form.codigoInterno}
                onChange={(e) => campo("codigoInterno", e.target.value)}
                placeholder="Ej. DY-001"
                required
              />
            </label>

            <label>
              <span>Marca *</span>
              <select
                value={form.marcaId}
                onChange={(e) => campo("marcaId", e.target.value)}
                required
              >
                <option value="">Selecciona…</option>
                {marcas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                    {m.activa ? "" : " (inactiva)"}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Modelo *</span>
              <input
                type="text"
                value={form.modelo}
                onChange={(e) => campo("modelo", e.target.value)}
                placeholder="Ej. Bota Amber"
                required
              />
            </label>

            <label>
              <span>Referencia</span>
              <input
                type="text"
                value={form.referencia ?? ""}
                onChange={(e) => campo("referencia", e.target.value)}
                placeholder="Referencia comercial"
              />
            </label>

            <label>
              <span>Color</span>
              <input
                type="text"
                value={form.color ?? ""}
                onChange={(e) => campo("color", e.target.value)}
                placeholder="Ej. Marrón"
              />
            </label>

            <label>
              <span>Precio normal *</span>
              <input
                type="number"
                min={0}
                step={1000}
                value={form.precioNormal}
                onChange={(e) => campo("precioNormal", Number(e.target.value))}
                required
              />
            </label>

            <label>
              <span>Estado</span>
              <select
                value={form.estado}
                onChange={(e) => campo("estado", e.target.value as EstadoProducto)}
              >
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>
                    {ETIQUETA_ESTADO[e]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {esEdicion && (
            <p className="rt-tenue">
              El slug de la URL se genera a partir del modelo y el código; no se edita a mano.
            </p>
          )}
        </section>

        <section className="rt-caja-formulario">
          <h2>Tallas y cantidades</h2>
          <p className="rt-tenue">
            Una fila por talla. Solo las tallas con cantidad mayor que cero se muestran al público.
          </p>

          <div className="rt-tallas-editor">
            {form.tallas.map((t, i) => (
              <div key={i} className="rt-talla-fila">
                <label>
                  <span>Talla</span>
                  <input
                    type="text"
                    value={t.talla}
                    onChange={(e) => tallaEn(i, { talla: e.target.value })}
                    placeholder="38"
                    inputMode="numeric"
                  />
                </label>
                <label>
                  <span>Cantidad</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={t.cantidad}
                    onChange={(e) => tallaEn(i, { cantidad: Number(e.target.value) })}
                  />
                </label>
                <button
                  type="button"
                  className="rt-enlace-boton"
                  onClick={() =>
                    setForm((f) => ({ ...f, tallas: f.tallas.filter((_, j) => j !== i) }))
                  }
                  aria-label={`Quitar talla ${t.talla || i + 1}`}
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="rt-boton rt-boton--secundario"
            onClick={() => setForm((f) => ({ ...f, tallas: [...f.tallas, { talla: "", cantidad: 0 }] }))}
          >
            Añadir talla
          </button>
        </section>

        {fallo && (
          <p className="rt-error" role="alert">
            {fallo}
          </p>
        )}

        <div className="rt-acciones-formulario">
          <button type="submit" className="rt-boton rt-boton--primario" disabled={guardando}>
            {guardando ? "Guardando…" : esEdicion ? "Guardar cambios" : "Crear producto"}
          </button>
          <Link className="rt-boton rt-boton--secundario" to="/admin/productos">
            Cancelar
          </Link>
        </div>
      </form>
    </>
  );
}
