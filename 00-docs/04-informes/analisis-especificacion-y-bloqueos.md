# Análisis de la especificación — Catálogo digital de calzado

**Fecha:** 27/10/2026
**Fuente única:** `Especificacion_Proyecto_Catalogo_Zapatos.pdf` (10 páginas, versión de traspaso inicial)
**Regla de este documento:** todo lo de abajo sale del PDF o de una verificación hecha en esta máquina. Nada está supuesto.

---

## 1. Qué se va a construir (lectura del PDF)

Catálogo digital de calzado con apariencia de boutique premium, detalles navideños discretos, mobile-first.

- **Modelo comercial:** consulta de productos y solicitudes por WhatsApp. **Sin pago en línea.**
- **Alcance:** catálogo público + panel privado de administración.
- **Base técnica declarada:** React + Vite, Vercel, GitHub y un proyecto Supabase vacío. **"Configuración por verificar"** (p.1 y p.6).
- **Criterio rector (p.2):** la automatización prepara datos; no sustituye la confirmación del administrador cuando hay incertidumbre (inventario, precios, tallas, marcas, publicación).

### Lo que la primera versión NO hace (p.2)
Pago en línea o carrito con checkout · creación automática de pedidos al abrir WhatsApp · almacenamiento automático de conversaciones de WhatsApp · registro público de usuarios o múltiples cuentas de administración · páginas de Nosotros/Contacto/FAQ/políticas · clasificación autónoma de fotos sin revisión humana.

---

## 2. Inventario funcional (por sección del PDF)

| # | Bloque | Contenido cerrado en el documento |
|---|---|---|
| 3 | Flujos | Cliente: inicio → marcas → catálogo de marca → búsqueda/filtros → ventana rápida o ficha → talla → confirmación → WhatsApp. Admin: login + 2FA → dashboard → productos → fotos → tallas → promociones/inventario/alertas/solicitudes → exportación y copias |
| 4 | Estructura pública | Inicio, hero, marcas (cuadrícula de logotipos), catálogo de marca **sin pantalla intermedia de colecciones**, tarjetas (2 por fila en móvil), búsqueda con sugerencias, filtros (talla, precio, modelo), paginación, ventana rápida, ficha completa, destacados y ofertas de la semana (selección manual) |
| 5 | Dirección visual | Boutique premium; paleta de referencia marfil / tierra / verde bosque / dorado discreto; **valores exactos a definir en el sistema visual**; Navidad sutil; fotografía consistente sin alterar color real; estados visibles; **nombre y logotipo pendientes** |
| 6 | Datos | 9 campos funcionales confirmados: código interno, marca, modelo/referencia, color (sugerido, confirmado por admin), tallas+cantidades, precio normal, precio promocional, fotografías (1 principal obligatoria), estado |
| 6 | Estados | Pendiente de revisión · Borrador · Publicado · Agotado · Archivado |
| 7 | Inventario | Control por talla con cantidad exacta; solo se muestran tallas con existencias; agotado permanece visible salvo archivado; actualización individual o en lote; historial con cantidad anterior/nueva, fecha, motivo y responsable; distinción entradas/ventas/ajustes; al confirmar solicitud el panel pregunta si descuenta; si faltan existencias se avisa y decide el admin; **la web no descuenta al abrir WhatsApp** |
| 8 | WhatsApp | Mensaje prellenado con producto, referencia, talla y precio; abrir WhatsApp no crea registro ni descuenta. Registro manual en panel: estados pendiente/confirmada/cancelada; campos producto, referencia, talla, precio, estado, nombre, teléfono, fecha, observaciones, motivo de cancelación; conservación indefinida hasta eliminación manual |
| 9 | Precios y promociones | Edición individual o en lote; mostrar valores anteriores y nuevos antes de guardar; historial de precios; promociones manuales o programadas con fecha final; al vencer vuelve el precio normal sin borrar historial; mostrar precio normal, vigente y descuento sin cálculos ambiguos |
| 10 | Panel | 1 sola cuenta admin, sin registro público; login usuario/contraseña; protección contra intentos repetidos; cierre por inactividad; 2FA; recuperación de contraseña por correo; acceso restringido. Dashboard: total productos, agotados, ofertas activas, pendientes de revisión, accesos directos |
| 10 | Secciones | Productos · Marcas · Inventario · Ofertas · Destacados · Solicitudes · Historial de inventario · Historial de precios · Importación/exportación · Alertas · Copias de seguridad · Configuración |
| 11 | Fotos e importación | Carga individual y por lotes; sugerencia de marca/modelo/color/tallas **con incertidumbre marcada**; si no hay confianza → pendiente de revisión; la extracción de tallas nunca reemplaza la entrada real de cantidades; admin elige foto principal y ordena; duplicados se muestran, **no se fusionan automáticamente**; CSV/Excel con validación y vista previa antes de aplicar |
| 12 | Copias | Automáticas diarias; varias versiones históricas; exportación manual; restauración desde panel **si la infraestructura lo permite**; definir qué se respalda, retención, ubicación, cifrado, permisos y pruebas; exportación de catálogo ≠ copia restaurable |
| 13 | Estado técnico | Frontend, hosting, base de datos, almacenamiento y automatización de imágenes: **todo "a verificar / a validar"**. Prohibido asumir que Supabase, Vercel o GitHub están bien configurados por el hecho de existir |
| 13 | Comparación | React + Vite vs WordPress: comparación **explícita y documentada** antes de decidir |
| 14 | Entidades | 11 candidatas (productos, marcas, imágenes, tallas/inventario, historial inventario, historial precios, promociones, destacados/ofertas, solicitudes, notificaciones, auditoría). **Guía de análisis, no esquema definitivo** |
| 15 | Seguridad | Mínimo privilegio; RLS por tabla y políticas de Storage; no exponer service-role; validar en cliente y servidor; proteger importaciones; limitar login; auditoría de acciones; minimizar datos personales; revisar requisitos legales en Colombia |
| 18 | Aceptación | 9 áreas con pruebas mínimas; proceso obligatorio: diseñar → implementar → probar → **auditar adversarialmente** → corregir → volver a probar → aprobar. Revisar visualmente no es verificar |
| 17 | Fases | 10 fases, de auditoría a lanzamiento. Fase 9 (automatización de fotos) solo después de que el flujo manual funcione |

**Decisiones ya cerradas:** puntos 43 a 67 (p.10), 25 en total.

---

## 3. Verificación de capacidades en esta máquina (hecha hoy)

### Herramientas locales
| Herramienta | Estado |
|---|---|
| Node.js | v22.23.2 |
| npm | 10.9.8 |
| git | 2.39.3 |
| Supabase CLI | instalado (`/opt/homebrew/bin/supabase`) |
| pnpm | no instalado (no es obligatorio) |

### Skills instaladas
`pdf`, `docx`, `xlsx`, `pptx`, `skill-finder`, `skill-creator`, `self-improvement`, `gmail-assistant`, `accio-mcp-cli` + `image-prompt-guide` (nivel cuenta).

**Conclusión honesta:** no hay ninguna skill de desarrollo frontend, React, sistema de diseño o Supabase instalada, y el catálogo remoto revisado (132 skills) **no ofrece** una equivalente para este stack; la única cercana (`create-website`) genera HTML estático y no aplica a React + Vite. Para construir esto no hace falta una skill: se trabaja con las herramientas de código que ya están (Node, npm, git, CLI de Supabase). Si quieres, puedo buscar e instalar una skill de UI/UX antes de la Fase 3.

### Accesos externos
- Conectores autorizados: **0**. No hay GitHub, Vercel ni Supabase conectados a esta cuenta.
- El workspace `Desktop/dayanara` **solo contiene el PDF**: no hay repositorio, no hay `package.json`, no hay proyecto Supabase, no hay variables de entorno.

**Consecuencia:** la Fase 1 (auditoría del repositorio) **no puede empezar** hasta que el código esté disponible aquí o haya un conector autorizado.

---

## 4. Lo que necesito de ti (bloqueantes, en orden)

### A. Acceso — sin esto no hay Fase 1
1. Ruta local del repo **o** URL del repositorio GitHub (y si debo clonarlo).
2. Proyecto Supabase: referencia o URL, y cómo accedo (CLI con `supabase login`, o me pasas la cadena de conexión por un medio privado).
3. Proyecto Vercel y dominio actual (si existe).

### B. Datos de marca y contacto — el documento los declara pendientes
4. Nombre de la tienda (definitivo o provisional).
5. Logotipo, si ya existe (archivo vectorial o imagen).
6. Número de WhatsApp para los mensajes.
7. Correo administrativo (login, 2FA y recuperación de contraseña).
8. Zona horaria de operación (para vencimiento de promociones y alertas).

### C. Decisiones que afectan arquitectura o dinero
9. Presupuesto mensual tolerado para Vercel + Supabase + correo, para que la Fase 2 compare con cifras reales y no con supuestos.
10. Si la comparación WordPress vs React debe considerar tu infraestructura WordPress actual.

### D. Se definen más adelante, con prototipo delante (no las invento)
Tipografías y valores exactos de color · umbrales de alerta de inventario · retención de copias · formato final de estados de solicitud · política de datos personales.

---

## 5. Cómo propongo avanzar

| Paso | Qué entrego | Requiere |
|---|---|---|
| 0 | Este análisis + inventario de requisitos | — (hecho) |
| 1 | Auditoría: estructura del repo, dependencias, build, estado de Supabase/Vercel, seguridad, riesgos. **Sin cambiar nada** | Bloque A |
| 2 | Comparación documentada React + Vite vs WordPress con costos y mantenimiento; decisión contigo | Bloque A + punto 9 |
| 3 | Sistema visual y mapa de páginas con prototipos (paleta, tipografía, componentes) | Identidad (punto 4-5) |
| 4+ | Base de seguridad → catálogo público → panel → WhatsApp/solicitudes → importaciones y copias → automatización de fotos | Aprobación por módulo |

Regla que aplico desde ya: **no escribo código del producto antes de la Fase 1**; el documento lo prohíbe expresamente ("inspeccionar el repositorio y el proyecto Supabase antes de modificar archivos o crear tablas").

---

## 6. Bitácora

| Fecha | Acción | Resultado |
|---|---|---|
| 27/10/2026 | Lectura completa del PDF (10 p.) y verificación de entorno | Sin cambios en ningún sistema. Solo lectura y creación de este documento |
