import { lazy, Suspense } from "react";
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
// El panel se carga aparte: un visitante del catálogo nunca descarga su código.
const Acceso = lazy(() => import("./pages/admin/Acceso").then((m) => ({ default: m.Acceso })));
const Panel = lazy(() => import("./pages/admin/Panel").then((m) => ({ default: m.Panel })));
const ProductosPanel = lazy(() =>
  import("./pages/admin/Productos").then((m) => ({ default: m.ProductosPanel })),
);
const ProductoForm = lazy(() =>
  import("./pages/admin/ProductoForm").then((m) => ({ default: m.ProductoForm })),
);
const MarcasAdmin = lazy(() =>
  import("./pages/admin/MarcasAdmin").then((m) => ({ default: m.MarcasAdmin })),
);
const Inventario = lazy(() =>
  import("./pages/admin/Inventario").then((m) => ({ default: m.Inventario })),
);

export default function App() {
  return (
    <BrowserRouter>
      {!supabaseConfigurado && (
        <p className="rt-aviso-config" role="status">
          Modo sin datos: faltan las variables de entorno de Supabase. El catálogo no puede
          consultar la base.
        </p>
      )}

      <Suspense
        fallback={
          <div className="rt-contenedor rt-cargando-panel" aria-busy="true">
            <div className="rt-esqueleto rt-esqueleto--titulo" />
          </div>
        }
      >
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
        <Route
          path="/admin/productos/nuevo"
          element={
            <RutaPrivada>
              <ProductoForm />
            </RutaPrivada>
          }
        />
        <Route
          path="/admin/productos/:id"
          element={
            <RutaPrivada>
              <ProductoForm />
            </RutaPrivada>
          }
        />
        <Route
          path="/admin/marcas"
          element={
            <RutaPrivada>
              <MarcasAdmin />
            </RutaPrivada>
          }
        />
        <Route
          path="/admin/inventario"
          element={
            <RutaPrivada>
              <Inventario />
            </RutaPrivada>
          }
        />

        <Route path="*" element={<NoEncontrada />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
