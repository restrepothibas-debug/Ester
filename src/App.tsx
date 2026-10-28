import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Encabezado } from "./components/Encabezado";
import { PiePagina } from "./components/PiePagina";
import { supabaseConfigurado } from "./lib/supabase";
import { Inicio } from "./pages/Inicio";
import { Marcas } from "./pages/Marcas";
import { Marca } from "./pages/Marca";
import { Buscar } from "./pages/Buscar";
import { Producto } from "./pages/Producto";
import { NoEncontrada } from "./pages/NoEncontrada";

/** Alcance de la primera versión (§2): catálogo público. El panel es Fase 6. */
export default function App() {
  return (
    <BrowserRouter>
      {!supabaseConfigurado && (
        <p className="rt-aviso-config" role="status">
          Modo sin datos: faltan las variables de entorno de Supabase. El catálogo no puede
          consultar la base.
        </p>
      )}

      <Encabezado />

      <main id="contenido">
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/marcas" element={<Marcas />} />
          <Route path="/marca/:slug" element={<Marca />} />
          <Route path="/buscar" element={<Buscar />} />
          <Route path="/producto/:slug" element={<Producto />} />
          <Route path="*" element={<NoEncontrada />} />
        </Routes>
      </main>

      <PiePagina />
    </BrowserRouter>
  );
}
