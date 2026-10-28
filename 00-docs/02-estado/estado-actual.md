# Estado actual del proyecto

**Última actualización:** 28/10/2026
**Actualiza este archivo al final de cada sesión.** Es lo primero que debe leer cualquier agente.

---

## Fase en curso

| Fase (PDF §17) | Estado |
|---|---|
| 1 — Auditoría del repositorio, despliegue, Supabase, dependencias y seguridad | ✅ **Cerrada** (27/10). Conclusión: no había nada que auditar, el proyecto hay que crearlo |
| 2 — Decisión de plataforma (React + Vite vs WordPress) | ✅ **Cerrada** a favor de React + Vite, con dos conflictos de plan gratuito sin resolver |
| 3 — Diseño funcional: mapa de páginas, componentes, esquema de datos y flujos | 🟨 **Entregada para revisión** (28/10): `05-diseno/esquema-datos.md` y `05-diseno/mapa-paginas.md`. Nada ejecutado en la base |
| 4 — Base de seguridad: auth, autorización, RLS, secretos, recuperación, 2FA | 🟨 **Preparada**: las políticas RLS ya están escritas y versionadas. Falta aplicarlas y crear la cuenta administradora |
| 5 a 10 — Catálogo público · panel · WhatsApp/solicitudes · importaciones y copias · automatización de fotos · auditoría y lanzamiento | ⬜ **No iniciadas** |

## Qué existe hoy en el repositorio local

| Elemento | Estado |
|---|---|
| Scaffold | React 19 + Vite 8 + TypeScript 7. `package.json` → `"ester"` |
| `npm run build` | ✅ Compila sin errores (verificado 27/10) |
| `src/App.tsx` | ⚠️ Sigue siendo **la plantilla de ejemplo de Vite** («Get started», contador). No hay producto |
| `src/types/domain.ts` | ✅ Tipos del dominio derivados de §6/§8/§14 |
| `src/lib/supabase.ts` | ✅ Cliente con solo clave `anon`; degrada a «modo sin datos» si faltan variables |
| `src/styles/tokens.css` | ⚠️ **Propuesta** de tokens visuales, sin aprobar |
| `src/styles/global.css` | ✅ Base tipográfica y de layout |
| `.env.local` | ✅ Creado (permisos `600`, ignorado por git) con URL, clave `anon` y clave secreta. **Cliente Supabase probado de extremo a extremo**: consulta autenticada contra el proyecto real |
| `.env.example` | ✅ Creado 27/10 con nombres de variables, sin valores |
| Repositorio git | ✅ `main`, remoto `origin` → `restrepothibas-debug/Ester`. 3 commits subidos el 28/10. Verificado por API: 36 archivos, **sin `.env.local` ni secretos** |
| Nombre de la tienda | ✅ **Dayara store** (D-13). Logotipo pendiente |
| Metadatos del proyecto | ✅ Alineados: `dayara-store`, título `Dayara store`, `lang="es"` |
| Migraciones SQL | 🟨 Escritas y versionadas en `supabase/migrations/` (esquema + RLS + Storage). **No aplicadas**: falta un medio de ejecutar DDL |
| Documentación | ✅ Estructurada en `00-docs/` (contexto, decisiones, estado, técnico, informes) |

## Estado de los sistemas externos (verificado 27/10/2026)

| Sistema | Estado real |
|---|---|
| GitHub — `restrepothibas-debug/Ester` | Existe, **público**, **0 commits**. La cuenta `epieyu1` (CLI) solo tiene lectura, pero el propietario entregó un **PAT de `restrepothibas-debug` con permisos `admin`** verificado por API. Guardado fuera del repo (ver `03-tecnico/variables-entorno.md`) |
| Vercel | CLI instalado, **sin sesión** (`~/.vercel` no existe). Sin proyecto conocido |
| Supabase | Proyecto `pklqdjixkhpkmtrhtzsm` **verificado el 28/10**: responde en `https://pklqdjixkhpkmtrhtzsm.supabase.co`, Postgres 14.18, GoTrue v2.197.0. **0 tablas, 0 vistas, 0 buckets** — confirma que está vacío, como decía el PDF. La clave secreta autentica correctamente. CLI sigue sin sesión. **Falta la clave publicable/`anon`** para que el cliente consulte |
| Entorno local | Node 22.23.2 · npm 10.9.8 · git 2.39.3 · gh 2.45.0 (`epieyu1`) · CLIs de Supabase y Vercel |

## Bloqueos abiertos, en orden

| # | Bloqueo | Quién lo resuelve |
|---|---|---|
| 1 | **Referencia del proyecto Supabase** (`https://<ref>.supabase.co`) y **clave publicable/`anon`**. La clave secreta ya llegó, pero sola no permite conectar ni verificar nada | Propietario |
| 2 | Cuenta/equipo de Vercel y plan (Hobby o Pro) + token si se despliega por CLI | Propietario |
| 3 | Aclarar «Gijo» | Propietario |
| 4 | Datos de marca y contacto: nombre, logo, WhatsApp, correo admin, zona horaria | Propietario |
| 5 | Rotar y reducir el token de GitHub (hoy sobredimensionado y expuesto en el chat) | Propietario |
| 6 | Decidir si se hace push a `Ester` (repo descrito como «portafolio de Ester») o se crea otro repositorio | Propietario |

**Resuelto el 27/10/2026:** acceso de escritura a GitHub.

## Siguiente paso

**Con los bloqueos 1–3 resueltos:** cerrar Fase 3 (mapa de páginas + esquema de datos documentado) antes de escribir producto, como exige §19 del PDF («inspeccionar el repositorio y el proyecto Supabase antes de modificar archivos o crear tablas»).

**Mientras llegan:** no se escribe código de producto. Se puede avanzar en el diseño del esquema de datos y el mapa de páginas sobre papel.

## Qué NO está hecho (para evitar falsas expectativas)

- No hay tablas, migraciones, RLS, buckets ni políticas de Storage.
- No hay autenticación ni 2FA.
- No hay despliegue en Vercel ni repositorio en GitHub.
- No hay integración de WhatsApp, ni importación, ni copias de seguridad.
- No hay nombre de tienda, logo, teléfono ni correo confirmados.
