import { Outlet } from "react-router-dom";
import { Encabezado } from "./Encabezado";
import { PiePagina } from "./PiePagina";

/** Marco del catálogo público. El panel tiene su propio marco. */
export function DisposicionPublica() {
  return (
    <>
      <Encabezado />
      <main id="contenido">
        <Outlet />
      </main>
      <PiePagina />
    </>
  );
}
