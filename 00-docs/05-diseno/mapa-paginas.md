# Mapa de páginas y componentes — propuesta para aprobación

**Estado:** propuesta de Fase 3. Nada implementado todavía.
**Base:** §3, §4, §5, §10 y §18 del PDF.

---

## 1. Rutas públicas

| Ruta | Pantalla | Contenido |
|---|---|---|
| `/` | Inicio | Hero → marcas → ofertas de la semana → destacados |
| `/marcas` | Cuadrícula de logotipos | Cada logo enlaza al catálogo de esa marca |
| `/marca/:slug` | Catálogo de marca | Productos **directos, sin pantalla intermedia de colecciones** (§4) |
| `/producto/:slug` | Ficha completa | Datos, fotos, precio normal, precio vigente, descuento, tallas disponibles, acción de WhatsApp |
| `/buscar` | Resultados | Query en la URL (`?q=`), reutiliza la cuadrícula de tarjetas |
| `*` | No encontrada | Página simple con retorno al catálogo |

Filtros y paginación viajan en la URL (`?talla=38&precio=…&modelo=…&pagina=2`, en `/marca/:slug` y `/buscar`), para que un enlace compartido por WhatsApp reproduzca exactamente lo que el cliente vio.

**Ventana rápida:** no es una ruta. Es un diálogo sobre el catálogo que permite ver detalles y elegir talla sin abandonar el listado. La ficha completa es una página aparte.

## 2. Rutas del panel

Prefijo `/admin`. Todo exige sesión; sin sesión redirige a `/admin/login`.

| Ruta | Pantalla |
|---|---|
| `/admin/login` | Acceso (usuario, contraseña, segundo factor) |
| `/admin` | Dashboard: total de productos, agotados, ofertas activas, pendientes de revisión, accesos directos |
| `/admin/productos` | Listado con filtros por estado y marca |
| `/admin/productos/nuevo` | Alta manual |
| `/admin/productos/:id` | Edición: datos, fotos, tallas y cantidades, precios, promoción, estado |
| `/admin/marcas` | Marcas, logo y estado |
| `/admin/inventario` | Actualización individual y en lote |
| `/admin/inventario/historial` | Movimientos con cantidad anterior/nueva, motivo, responsable y fecha |
| `/admin/precios/historial` | Cambios de precio con fecha y responsable |
| `/admin/promociones` | Manuales y programadas |
| `/admin/destacados` | Selección y orden de destacados y ofertas de la semana |
| `/admin/solicitudes` | Bandeja con estados pendiente / confirmada / cancelada |
| `/admin/solicitudes/nueva` | Registro manual |
| `/admin/importacion` | Carga CSV/Excel con vista previa y detección de duplicados |
| `/admin/alertas` | Notificaciones del panel |
| `/admin/copias` | Exportación, versiones y restauración — **sujeto a lo que permita la infraestructura** |
| `/admin/configuracion` | Cuenta, seguridad, zona horaria |

## 3. Componentes compartidos

| Componente | Dónde | Nota |
|---|---|---|
| `Header` | Público | Navegación mínima: inicio, marcas, búsqueda |
| `Hero` | Inicio | Zapato protagonista, fondo marfil, luz de estudio, decoración navideña discreta |
| `MarcaGrid` | Inicio y `/marcas` | Cuadrícula de logotipos |
| `ProductCard` | Catálogo | Minimalista; **dos por fila en móvil**; indica si hay tallas disponibles **sin listarlas todas** |
| `QuickView` | Catálogo | Diálogo con talla y acción de WhatsApp |
| `Filtros` | Catálogo | Talla, precio, modelo |
| `Buscador` | Header | Sugerencias mientras se escribe: marca, modelo, referencia, color |
| `Paginacion` | Catálogo | — |
| `SelectorTalla` | Ficha y ventana rápida | Solo tallas con existencias |
| `BotonWhatsApp` | Ficha y ventana rápida | Abre WhatsApp con mensaje preparado; **no crea registro ni descuenta** |
| `EstadoProducto` | Panel | Etiqueta de los cinco estados |
| `AvisoInventario` | Panel | Advierte existencias insuficientes sin modificar cantidades en silencio |

## 4. Estados visibles y comportamiento

| Situación | Qué ve el cliente |
|---|---|
| Producto `publicado` con stock | Precio vigente, tallas disponibles, acción de WhatsApp |
| Producto `agotado` | Etiqueta «Agotado», sin acción de solicitud |
| Producto `borrador`, `pendiente_revision`, `archivado` | **No existe para el público** (ni por URL directa) |
| Marca sin productos publicados | No se muestra en la cuadrícula |
| Búsqueda sin resultados | Mensaje claro y salida al catálogo |
| Promoción vencida | Vuelve el precio normal; el historial no se toca |

## 5. Reglas de diseño que condicionan la implementación

- Mobile-first real: la tarjeta y la ventana rápida se diseñan primero a 375 px.
- Paleta de referencia marfil / tierra / verde bosque / dorado discreto. **Los valores exactos siguen pendientes**; `src/styles/tokens.css` contiene una propuesta, no una aprobación.
- Navidad sutil: acentos decorativos moderados, sin saturar ni desplazar la identidad premium.
- Fotografía consistente, fondos neutros, sin alterar el color real del calzado.
- Accesibilidad mínima verificable: contraste, foco visible, navegación por teclado en la ventana rápida y en el panel.

## 6. Lo que este mapa deliberadamente no incluye

Páginas de Nosotros, Contacto, FAQ o políticas (fuera de alcance, §2), carrito, checkout, cuenta de cliente y registro público. Si alguna aparece más adelante, es un cambio de alcance que se registra en `01-decisiones/decisiones.md` antes de programarse.
