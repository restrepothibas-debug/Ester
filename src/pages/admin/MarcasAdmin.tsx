import { useState } from "react";
import { listarMarcasAdmin, type MarcaAdmin } from "../../lib/admin";
import { actualizarMarca, crearMarca } from "../../lib/mutaciones";
import { useConsulta } from "../../lib/useConsulta";

/**
 * §11 — marcas: el sistema puede sugerir, pero el administrador confirma.
 * El logo queda pendiente: la subida de archivos llega con el módulo de imágenes.
 */
export function MarcasAdmin() {
  const [refresco, setRefresco] = useState(0);
  const { cargando, datos, error } = useConsulta(() => listarMarcasAdmin(), [refresco]);
  const [editando, setEditando] = useState<MarcaAdmin | null>(null);
  const [nombre, setNombre] = useState("");
  const [activa, setActiva] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);

  const marcas = datos ?? [];

  function nuevo() {
    setEditando(null);
    setNombre("");
    setActiva(true);
    setFallo(null);
  }

  function editar(marca: MarcaAdmin) {
    setEditando(marca);
    setNombre(marca.nombre);
    setActiva(marca.activa);
    setFallo(null);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setFallo(null);
    if (!nombre.trim()) {
      setFallo("El nombre es obligatorio.");
      return;
    }
    setGuardando(true);
    try {
      if (editando) await actualizarMarca(editando.id, { nombre, activa });
      else await crearMarca({ nombre, activa });
      setRefresco((n) => n + 1);
      nuevo();
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
        <h1>Marcas</h1>
        <p className="rt-tenue">
          El slug de la URL se calcula solo a partir del nombre. Los logotipos llegan con el módulo
          de imágenes.
        </p>
      </header>

      <div className="rt-panel-dos-columnas">
        <form className="rt-caja-formulario" onSubmit={guardar}>
          <h2>{editando ? "Editar marca" : "Nueva marca"}</h2>

          <label>
            <span>Nombre</span>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Dayara"
              required
            />
          </label>

          <label className="rt-casilla">
            <input type="checkbox" checked={activa} onChange={(e) => setActiva(e.target.checked)} />
            <span>Activa (visible en el catálogo)</span>
          </label>

          {fallo && (
            <p className="rt-error" role="alert">
              {fallo}
            </p>
          )}

          <div className="rt-acciones-formulario">
            <button type="submit" className="rt-boton rt-boton--primario" disabled={guardando}>
              {guardando ? "Guardando…" : editando ? "Guardar cambios" : "Crear marca"}
            </button>
            {editando && (
              <button type="button" className="rt-boton rt-boton--secundario" onClick={nuevo}>
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div>
          {error && (
            <p className="rt-error" role="alert">
              No se pudieron cargar las marcas: {error.message}
            </p>
          )}

          {cargando ? (
            <div className="rt-esqueleto rt-esqueleto--tabla" />
          ) : marcas.length === 0 ? (
            <div className="rt-vacio">Todavía no hay marcas. Crea la primera.</div>
          ) : (
            <div className="rt-tabla-envoltura">
              <table className="rt-tabla rt-tabla--compacta">
                <thead>
                  <tr>
                    <th>Marca</th>
                    <th>Slug</th>
                    <th className="rt-num">Productos</th>
                    <th>Estado</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {marcas.map((m) => (
                    <tr key={m.id}>
                      <td>{m.nombre}</td>
                      <td className="rt-mono">{m.slug}</td>
                      <td className="rt-num">{m.productos}</td>
                      <td>
                        <span className={`rt-chip ${m.activa ? "rt-chip--publicado" : ""}`}>
                          {m.activa ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      <td>
                        <button type="button" className="rt-enlace-boton" onClick={() => editar(m)}>
                          Editar
                        </button>
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
