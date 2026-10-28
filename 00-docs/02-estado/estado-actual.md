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
| 6 — Panel: productos, marcas, fotos, estados, inventario, precios y promociones | 🟨 **En curso**: marcas, productos con tallas, inventario con historial, registro de cambios de precio y **promociones**. Faltan fotos, destacados/oferta de la semana y solicitudes |
| 7 a 10 — WhatsApp/solicitudes · importaciones y copias · automatización de fotos · auditoría y lanzamiento | ⬜ **No iniciadas** |

## Qué existe hoy

| Elemento | Estado |
|---|---|
| Stack | React 19 + Vite 8 + TypeScript 7 · `package.json` → `dayara-store` · título y `lang="es"` alineados |
| `npm run build` | ✅ Termina en 0. Bundle principal 503 kB; el panel va en chunks aparte |
| `npm run lint` | ✅ Sin errores; 5 avisos de hooks en consultas |
| Catálogo público | ✅ 6 rutas (`/`, `/marcas`, `/marca/:slug`, `/buscar`, `/producto/:slug`, 404), 13 componentes, 12 páginas. Filtros y paginación en la URL, ventana rápida, selector de talla y mensaje de WhatsApp |
| Panel privado | ✅ Acceso, resumen, marcas, productos (alta y edición con tallas), inventario con historial y **promociones** (manuales y programadas, con vencimiento en Bogotá). Guard por sesión **y** perfil de administrador |
| `src/App.tsx` | ✅ Enrutador real. Las rutas del panel se cargan de forma diferida |
| `src/lib/` | `supabase.ts`, `consultas.ts` (lectura pública), `admin.ts` (lectura del panel), `mutaciones.ts` (escritura con historial), `auth.ts`, `formato.ts`, `fechas.ts` (horas de Bogotá), `whatsapp.ts` |
| Tipos del dominio | ✅ `src/types/domain.ts`, derivados de §6, §8 y §14 |
| Estilos | `tokens.css` (propuesta sin aprobar), `global.css`, `catalogo.css`, `admin.css` |
| `.env.local` | ✅ Permisos `600`, ignorado por git, con URL, clave `anon`, clave secreta y cadena de conexión |
| `.env.example` | ✅ Nombres de variables, sin valores |
| Repositorio git | ✅ `main` con remoto `origin` → `restrepothibas-debug/Ester` (público). **13 commits, 93 archivos**, sin secretos. Verificado por API |
| Base de datos | ✅ **14 tablas** en `public` (13 de dominio + `migraciones_aplicadas`), RLS en todas, **28 políticas** (23 sobre tablas y 5 sobre `storage.objects`), 3 buckets, 5 filas de configuración. **6 migraciones** aplicadas. Reglas de promoción en la base: 1 restricción de exclusión y 2 disparadores |
| Cuenta administradora | ✅ `epieyualex01@gmail.com`, correo confirmado, perfil creado por trigger. Contraseña inicial generada por Accio: **debe cambiarla el propietario** (D-27) |
| Nombre de la tienda | ✅ **Dayara store** (D-13). Logotipo pendiente |
| Documentación | ✅ `00-docs/` en 7 áreas, incluida `06-metodo/` con método, listón y rondas |

## Sistemas externos

| Sistema | Estado |
|---|---|
| GitHub — `restrepothibas-debug/Ester` | Público, 12 commits. PAT con permisos `admin` guardado fuera del repositorio (ver `03-tecnico/variables-entorno.md`) |
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
- **E8 sin probar:** no se verificó de extremo a extremo que un cambio de precio normal durante una promoción quede en `historial_precios`. El código lo hace; falta la prueba.
- No hay pantalla de historial de precios ni aviso de promoción por vencer.
- No hay copias de seguridad automáticas: el plan actual de Supabase no las incluye (§12 sin cumplir).

## Método de trabajo

Activo desde el 28/10/2026. Ver `06-metodo/gauntlet.md`, el listón en `06-metodo/liston.md` y el registro en `06-metodo/rondas.md`. Antes de entregar: `./scripts/verificar.sh` y revisión adversarial con el subagente `verification`.

## Siguiente paso

**Destacados y oferta de la semana** (tabla `selecciones`, D-33): elegir a mano qué productos aparecen como destacados y cuál es la oferta de la semana, sin precio propio. Después, **solicitudes de WhatsApp** (puntos 57–61).

## Qué NO está hecho

- Fotografías de producto: subida, foto principal y orden (§6, §10).
- Destacados y oferta de la semana: la interfaz (la tabla existe; no es una promoción, D-33).
- Solicitudes de WhatsApp: registro manual, estados y descuento con confirmación (§8).
- Importación CSV/Excel y exportación (punto 49).
- Alertas en el panel y por correo (punto 63).
- Copias de seguridad y restauración (§12 y punto 66).
- 2FA, límite de intentos, cierre por inactividad y recuperación de contraseña (punto 62).
- Despliegue en Vercel.
