# Estado actual del proyecto

**Última actualización:** 27/10/2026
**Actualiza este archivo al final de cada sesión.** Es lo primero que debe leer cualquier agente.

---

## Fase en curso

| Fase (PDF §17) | Estado |
|---|---|
| 1 — Auditoría del repositorio, despliegue, Supabase, dependencias y seguridad | ✅ **Cerrada** (27/10). Conclusión: no había nada que auditar, el proyecto hay que crearlo |
| 2 — Decisión de plataforma (React + Vite vs WordPress) | ✅ **Cerrada** a favor de React + Vite, con dos conflictos de plan gratuito sin resolver |
| 3 — Diseño funcional: mapa de páginas, componentes, esquema de datos y flujos | ⬜ **No iniciada** |
| 4 — Base de seguridad: auth, autorización, RLS, secretos, recuperación, 2FA | ⬜ **No iniciada** |
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
| `.env` / `.env.local` | ❌ No existen. `SUPABASE` no está configurado |
| `.env.example` | ✅ Creado 27/10 con nombres de variables, sin valores |
| Repositorio git local | ❌ **No inicializado.** Sin historial, sin remoto |
| Documentación | ✅ Estructurada en `00-docs/` (contexto, decisiones, estado, técnico, informes) |

## Estado de los sistemas externos (verificado 27/10/2026)

| Sistema | Estado real |
|---|---|
| GitHub — `restrepothibas-debug/Ester` | Existe, **público**, **0 commits**. Cuenta autenticada `epieyu1` con `pull: true`, **`push: false`** |
| Vercel | CLI instalado, **sin sesión** (`~/.vercel` no existe). Sin proyecto conocido |
| Supabase | CLI instalado, **sin sesión** (`~/.supabase/access-token` no existe). **Sin referencia de proyecto** → no verificable |
| Entorno local | Node 22.23.2 · npm 10.9.8 · git 2.39.3 · gh 2.45.0 (`epieyu1`) · CLIs de Supabase y Vercel |

## Bloqueos abiertos, en orden

| # | Bloqueo | Quién lo resuelve |
|---|---|---|
| 1 | Permiso de escritura en GitHub (colaborador con escritura, repo nuevo bajo `epieyu1`, o token con push) | Propietario |
| 2 | Referencia del proyecto Supabase + forma de acceso | Propietario |
| 3 | Cuenta/equipo de Vercel y plan (Hobby o Pro) | Propietario |
| 4 | Aclarar «Gijo» | Propietario |
| 5 | Datos de marca y contacto: nombre, logo, WhatsApp, correo admin, zona horaria | Propietario |
| 6 | Créditos de Supabase cargados en `.env.local` | Agente, en cuanto lleguen |

## Siguiente paso

**Con los bloqueos 1–3 resueltos:** cerrar Fase 3 (mapa de páginas + esquema de datos documentado) antes de escribir producto, como exige §19 del PDF («inspeccionar el repositorio y el proyecto Supabase antes de modificar archivos o crear tablas»).

**Mientras llegan:** no se escribe código de producto. Se puede avanzar en el diseño del esquema de datos y el mapa de páginas sobre papel.

## Qué NO está hecho (para evitar falsas expectativas)

- No hay tablas, migraciones, RLS, buckets ni políticas de Storage.
- No hay autenticación ni 2FA.
- No hay despliegue en Vercel ni repositorio en GitHub.
- No hay integración de WhatsApp, ni importación, ni copias de seguridad.
- No hay nombre de tienda, logo, teléfono ni correo confirmados.
