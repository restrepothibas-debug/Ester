import { Link } from "react-router-dom";

export function NoEncontrada() {
  return (
    <section className="rt-seccion">
      <div className="rt-contenedor">
        <div className="rt-vacio">
          <p className="rt-etiqueta">Error 404</p>
          <h1>Esta página no existe</h1>
          <p>Puede que el enlace esté incompleto o que el producto ya no esté publicado.</p>
          <Link className="rt-boton rt-boton--primario" to="/">
            Volver al inicio
          </Link>
        </div>
      </div>
    </section>
  );
}
