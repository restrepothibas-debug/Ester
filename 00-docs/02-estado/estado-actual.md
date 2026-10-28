# Estado actual del proyecto

**Última actualización:** 28/10/2026
**Actualiza este archivo al final de cada sesión.** Es lo primero que debe leer cualquier agente. Si algo aquí contradice al código o a la base, este archivo está mal y se corrige.

---

## Fase en curso

| Fase (PDF §17) | Estado |
|---|---|
| 1 — Auditoría del repositorio, despliegue, Supabase, dependencias y seguridad | ✅ **Cerrada** (27/10). No había nada que auditar: el proyecto hubo que crearlo |
| 2 — Decisión de plataforma (React + Vite vs WordPress) | ✅ **Cerrada** a favor de React + Vite, con dos conflictos de plan gratuito sin resolver |
| 3 — Diseño funcional: mapa de páginas, componentes, esquema de datos y flujos | ✅ **Documentada y en uso**: `05-diseno/esquema-datos.md` y `05-diseno/mapa-paginas.md`. El esquema está aplicado en la base y el código se construye contra él. La aprobación formal del propietario sigue pendiente |
| 4 — Base de seguridad: auth, autorización, RLS, secretos, recuperación, 2FA | 🟨 **RLS aplicado y sesión real verificada**. Faltan 2FA, límite de intentos, cierre por inactividad y recuperación de contraseña |
| 5 — Catálogo público | ✅ **Construido y verificado en navegador**. Sin datos reales ni despliegue |
| 6 — Panel: productos, marcas, fotos, estados, inventario, precios y promociones | 🟨 **En curso**: marcas, productos con tallas, inventario con historial, registro de cambios de precio y **promociones**, **destacados/oferta de la semana** y **solicitudes**. Faltan fotos |
| 7 a 10 — WhatsApp/solicitudes · importaciones y copias · automatización de fotos · auditoría y lanzamiento | ⬜ **No iniciadas** |

## Qué existe hoy

| Elemento | Estado |
|---|---|
| Stack | React 19 + Vite 8 + TypeScript 7 · `package.json` → `dayara-store` · título y `lang="es"` alineados |
| `npm run build` | ✅ Termina en 0. Bundle principal 503 kB; el panel va en chunks aparte |
| `npm run lint` | ✅ Sin errores; 4 avisos de hooks (`auth.ts`, `useConsulta.ts`, `ProductoForm.tsx`, `Inventario.tsx`) |
| Catálogo público | ✅ 6 rutas (`/`, `/marcas`, `/marca/:slug`, `/buscar`, `/producto/:slug`, 404), 13 componentes, 12 páginas. Filtros y paginación en la URL, ventana rápida, selector de talla y mensaje de WhatsApp |
| Panel privado | ✅ Acceso, resumen, marcas, productos (alta y edición con tallas), inventario con historial **promociones** (manuales y programadas, con vencimiento en Bogotá) **destacados/oferta de la semana** (selección manual con orden) y **solicitudes de WhatsApp** (registro manual, confirmación con o sin descuento, cancelación con devolución). Guard por sesión **y** perfil de administrador |
| `src/App.tsx` | ✅ Enrutador real. Las rutas del panel se cargan de forma diferida |
| `src/lib/` | `supabase.ts`, `consultas.ts` (lectura pública), `admin.ts` (lectura del panel), `mutaciones.ts` (escritura con historial), `auth.ts`, `formato.ts`, `fechas.ts` (horas de Bogotá), `whatsapp.ts` |
| Ingesta de fotos | ✅ `scripts/procesar-fotos.py`: procesa una exportación de WhatsApp (`.zip` o carpeta), deduplica por SHA-256, clasifica (pendiente / revisar / descartada / no_soportado), exporta WebP 1600 px + miniatura 480 px y lleva índice SQLite. Probado con exportación sintética: **30 comprobaciones** en `scripts/probar-procesar-fotos.py`. Salida en `fotos/`, fuera de git |
| Fotos de producto | ✅ `/admin/fotos`: subida con reducción en el navegador, bandeja de sin asignar, asignación a producto, principal y orden. Base: migración 12 con `fotos_sin_asignar` y seis funciones; escrituras directas bloqueadas. Probado: 20 comprobaciones en `scripts/probar-fotos.py` y navegador real (duplicado, asignación, principal, orden y ficha con foto) |
| Pruebas | `scripts/probar-reglas-promociones.py` (16 casos, `rollback`), `scripts/probar-promociones-publico.py` (9 comprobaciones con rol `anon`) `scripts/probar-destacados.py` (11 comprobaciones) y `scripts/probar-solicitudes.py` (24 comprobaciones: descuento, falta de existencias, cancelación con devolución, escrituras directas prohibidas y `anon`) |
| Tipos del dominio | ✅ `src/types/domain.ts`, derivados de §6, §8 y §14 |
| Estilos | ✅ Reconstruidos sobre la referencia visual (D-41): `tokens.css` con la paleta y la escala nuevas, `global.css` con las primitivas, `catalogo.css` con cabecera, héroe, garantías, accesos por marca, relato, rejillas, ficha y pie; `admin.css` hereda la misma paleta y tipografía |
| Tipografía | ✅ **Autoalojada** (D-45): dos `.woff2` variables (Cormorant Garamond 37,8 kB · Inter 48,4 kB) en `public/fuentes/`, `@font-face` en `src/styles/fuentes.css`, precarga en `index.html` y caché inmutable en `vercel.json`. Sin peticiones a Google en ejecución; `verificar.sh` lo comprueba |
| `.env.local` | ✅ Permisos `600`, ignorado por git, con URL, clave `anon`, clave secreta y cadena de conexión |
| `.env.example` | ✅ Nombres de variables, sin valores |
| Repositorio git | ✅ `main` con remoto `origin` → `restrepothibas-debug/Ester` (público), sin secretos. El historial completo está en `git log` |
| Base de datos | ✅ **15 tablas** en `public` (14 de dominio + `migraciones_aplicadas`), RLS en todas, **28 políticas** (23 sobre tablas y 5 sobre `storage.objects`), 3 buckets, 5 filas de configuración. **11 migraciones** aplicadas. Reglas de promoción en la base: 1 restricción de exclusión y 2 disparadores; las solicitudes solo se escriben por funciones |
| Cuenta administradora | ✅ `epieyualex01@gmail.com`, correo confirmado, perfil creado por trigger. Contraseña inicial generada por Accio: **debe cambiarla el propietario** (D-27) |
| Nombre de la tienda | ✅ **Dayara store** (D-13). Logotipo pendiente |
| Documentación | ✅ `00-docs/` en 7 áreas, incluida `06-metodo/` con método, listón y rondas |

## Sistemas externos

| Sistema | Estado |
|---|---|
| GitHub — `restrepothibas-debug/Ester` | Público. PAT con permisos `admin` guardado fuera del repositorio (ver `03-tecnico/variables-entorno.md`) |
| Supabase | Proyecto `pklqdjixkhpkmtrhtzsm` · Postgres 14.18 · GoTrue v2.197.0 · pooler `aws-0-us-east-2`. Esquema aplicado. CLI sin sesión, pero no hace falta: la conexión directa funciona |
| Vercel | CLI instalado, **sin sesión** y **sin proyecto**. Único servicio sin tocar |
| Entorno local | Node 22.23.2 · npm 10.9.8 · git 2.39.3 · gh 2.45.0 (`epieyu1`) |

## Bloqueos abiertos

| # | Bloqueo | Quién lo resuelve |
|---|---|---|
| 1 | **Despliegue en Vercel**: cuenta/equipo, plan (Hobby o Pro) y, si se despliega por CLI, token | Propietario |
| 2 | **Número de WhatsApp** para el mensaje prellenado | Propietario |
| 3 | **Logotipo** de la tienda | Propietario |
| 4 | **2FA, límite de intentos y cierre por inactividad** | Accio, cuando se aborde la Fase 10 |
| 5 | **Recuperación de contraseña por correo**: el correo no se configura en este proceso (D-22) | Aplazado por decisión del propietario |
| 6 | **Rotación del token de GitHub**: el propietario acepta el riesgo y pidió no rotarlo (D-11) | Cerrado por decisión |

**Resueltos:** acceso de escritura a GitHub · proyecto Supabase y sus claves · cuenta administradora · nombre de la tienda · «Gijo» = GitHub · destino del repositorio.

## Limitaciones conocidas

- El bundle principal pesa 503 kB. Lo domina `supabase-js`, no el código propio.
- Los precios dejan historial al editarse, pero **no hay pantalla para consultarlo**.
- La búsqueda (B2 del listón) solo se probó con la base vacía: falta con datos reales.
- La foto de un producto destacado no existe todavía: las tarjetas del inicio se ven sin imagen hasta que llegue el módulo de fotografías.
- No hay pantalla de historial de precios ni aviso de promoción por vencer.
- El filtro de precio del catálogo usa el **precio normal**, no el vigente: un producto con 200.000 y promoción de 150.000 no aparece al filtrar «hasta 160.000». Pendiente de decidir cómo filtrar por precio promocional.
- Borrar un producto arrastra en cascada sus promociones y sus selecciones, y no deja evento en `auditoria`. Hoy no hay borrado en la interfaz (`historial_precios` lo impide con una clave foránea restrictiva), pero si algún día se añade hay que decidir qué pasa con ese historial.
- El panel calcula vigencia con el reloj del equipo; el catálogo anónimo no depende de él porque RLS ya filtró en el servidor.
- La base acepta una promoción sobre un producto en borrador o pendiente (la interfaz ya no los ofrece). No es visible al público, pero la regla solo vive en la interfaz.
- La fecha de inicio de una promoción programada se propone al abrir la página: si el panel queda abierto mucho rato, la hora sugerida envejece.
- No hay copias de seguridad automáticas: el plan actual de Supabase no las incluye (§12 sin cumplir).

## Diseño

El catálogo sigue la referencia enviada por el propietario. Comprobado en navegador a 390, 768 y 1280 px: sin desbordes horizontales, 2 columnas de tarjetas en móvil, menú plegable y 0 errores de consola. Las dos fuentes se cargan desde el mismo origen (`document.fonts` las reporta `loaded`, 0 peticiones a `fonts.gstatic.com`). Las capturas de esa revisión están en `revision/` (fuera de git).

## Método de trabajo

Activo desde el 28/10/2026. Ver `06-metodo/gauntlet.md`, el listón en `06-metodo/liston.md` y el registro en `06-metodo/rondas.md`. Antes de entregar: `./scripts/verificar.sh` y revisión adversarial con el subagente `verification`.

## Siguiente paso

**Importación CSV/Excel y exportación** (punto 49). La ingesta de fotos ya está cerrada de punta a punta: procesador local para lotes y pantalla de asignación en el panel.

## Qué NO está hecho

- Fotografías de producto: subida a Storage, foto principal y orden (§6, §10). El procesador local ya existe; falta la pantalla que asigna cada foto a un producto.
- Importación CSV/Excel y exportación (punto 49).
- Alertas en el panel y por correo (punto 63).
- Copias de seguridad y restauración (§12 y punto 66).
- 2FA, límite de intentos, cierre por inactividad y recuperación de contraseña (punto 62).
- Despliegue en Vercel.
