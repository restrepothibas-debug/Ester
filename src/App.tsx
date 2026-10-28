import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DisposicionPublica } from "./components/DisposicionPublica";
import { RutaPrivada } from "./components/admin/RutaPrivada";
import { supabaseConfigurado } from "./lib/supabase";
import { Inicio } from "./pages/Inicio";
import { Marcas } from "./pages/Marcas";
import { Marca } from "./pages/Marca";
import { Buscar } from "./pages/Buscar";
import { Producto } from "./pages/Producto";
import { NoEncontrada } from "./pages/NoEncontrada";
import { Acceso } from "./pages/admin/Acceso";
import { Panel } from "./pages/admin/Panel";
import { ProductosPanel } from "./pages/admin/Productos";

export default function App() {
  return (
    <BrowserRouter>
      {!supabaseConfigurado && (
        <p className="rt-aviso-config" role="status">
          Modo sin datos: faltan las variables de entorno de Supabase. El catálogo no puede
          consultar la base.
        </p>
      )}

      <Routes>
        <Route element={<DisposicionPublica />}>
          <Route path="/" element={<Inicio />} />
          <Route path="/marcas" element={<Marcas />} />
          <Route path="/marca/:slug" element={<Marca />} />
          <Route path="/buscar" element={<Buscar />} />
          <Route path="/producto/:slug" element={<Producto />} />
        </Route>

        <Route path="/admin/login" element={<Acceso />} />

        <Route
          path="/admin"
          element={
            <RutaPrivada>
              <Panel />
            </RutaPrivada>
          }
        />
        <Route
          path="/admin/productos"
          element={
            <RutaPrivada>
              <ProductosPanel />
            </RutaPrivada>
          }
        />

        <Route path="*" element={<NoEncontrada />} />
      </Routes>
    </BrowserRouter>
  );
}
