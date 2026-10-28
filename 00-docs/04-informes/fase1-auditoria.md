# Fase 1 — Auditoría del estado real

**Fecha:** 27/10/2026 · **Método:** verificación directa (GitHub API, CLI local, workspace). Nada de este informe es supuesto.

---

## 1. Lo que encontré

| Componente declarado en el PDF | Estado real verificado | Evidencia |
|---|---|---|
| Proyecto React + Vite «existente» | **No existe.** El repositorio está vacío: 0 commits, `main` sin contenido | `gh api repos/restrepothibas-debug/Ester` → `size: 0`, commits → HTTP 409 "Git Repository is empty" |
| Repositorio GitHub | Existe, es **público**, creado el 28/10/2026 03:27 UTC (27/10 22:27 Bogotá) | Misma consulta: `created_at`, `private: false` |
| Permiso de escritura | **No lo tengo.** La cuenta autenticada en esta máquina (`epieyu1`) solo tiene `pull`; `push: false` | `permissions` del repo |
| Vercel | **No hay proyecto.** El propietario confirmó «aún no» | Respuesta del propietario |
| Supabase | El propietario dice que el proyecto existe, **pero no entregó la referencia**; sin ref no se puede verificar nada | Campo del formulario llegó con la URL del repo, no la ref |
| Workspace `Desktop/dayanara` | Solo contiene el PDF. Sin `package.json`, sin `.env`, sin migraciones | Listado del directorio |
| Conectores autorizados (GitHub / Vercel / Supabase) | **0** | `list_all_authorizations` → `total: 0` |

### Herramientas locales disponibles
`node v22.23.2` · `npm 10.9.8` · `git 2.39.3` · `supabase CLI` (`/opt/homebrew/bin/supabase`) · `gh 2.45.0` autenticado como `epieyu1`.
`pnpm` no está instalado (irrelevante: npm basta).

---

## 2. Consecuencia sobre el plan

El documento pide auditar antes de tocar. La auditoría dice: **no hay nada que auditar; el proyecto hay que crearlo.** Eso no rompe el plan, lo reordena:

- La Fase 3 (diseño funcional) y la Fase 4 (esquema + seguridad) **no dependen** de datos existentes: se diseñan desde la especificación y se documentan antes de programar, como exige el PDF.
- La Fase 1 queda cerrada con este informe y se reabre parcialmente cuando exista proyecto Supabase verificable.

---

## 3. Choque entre «solo planes gratis» y requisitos del PDF

Decidiste presupuesto **cero**. Con ese límite, tres requisitos escritos en la especificación **no se cumplen con las herramientas nativas**. Verificado en fuentes oficiales:

| Requisito del PDF | Con plan gratis | Fuente |
|---|---|---|
| §12 Copias de seguridad automáticas diarias + varias versiones históricas + restauración | Supabase **solo respalda automáticamente en Pro, Team y Enterprise**. En Free la propia documentación recomienda exportar con `supabase db dump` y mantener copias fuera | [supabase.com/docs/guides/platform/backups](https://supabase.com/docs/guides/platform/backups) |
| §12 Restauración desde el panel | No es una función de Supabase en Free; habría que construirla (descarga y reimportación) | Misma fuente |
| §12/§15 Copia completa restaurable | Los backups de base de datos **no incluyen los objetos de Storage** (las fotos). Requiere exportación aparte | Misma fuente |
| Despliegue comercial en Vercel Hobby | Hobby está limitado a **uso personal no comercial**. Un catálogo que promociona productos para vender entra en la definición comercial de sus guías | [vercel.com/docs/plans/hobby](https://vercel.com/docs/plans/hobby) · [Fair Use](https://vercel.com/docs/limits/fair-use-guidelines) |
| §10 y punto 63 Disponibilidad del sitio y alertas | Un proyecto Supabase Free **se pausa tras una semana sin actividad**: el catálogo dejaría de responder y las alertas por correo no saldrían | [Project Pausing](https://supabase.com/docs/guides/platform/free-project-pausing) |

**No estoy recomendando pagar.** Hay salidas honestas y sin costo:

1. **Copias:** tarea programada en GitHub Actions que ejecute `supabase db dump` + exportación de Storage a un repositorio privado o release. Cumple «diaria» y «varias versiones», no cumple «restaurar desde el panel» (sería restauración documentada, no botón).
2. **Vercel:** quedarse en Hobby es incumplir sus términos. Alternativa sin costo a evaluar: Cloudflare Pages (su página de límites del plan Free no impone restricción comercial, pero **la política comercial hay que confirmarla por escrito antes de migrar**, no lo doy por hecho). Esto entra en la Fase 2.
3. **Pausa por inactividad:** un chequeo periódico mínimo mantiene el proyecto activo, pero es un parche: lo correcto es asumir el plan Pro cuando el catálogo esté en producción.

Estas tres son decisiones tuyas, no mías. Las marco como **pendientes de aprobación** y no las implemento hasta que digas.

---

## 4. Bloqueos abiertos (para poder avanzar)

| # | Bloqueo | Quién lo resuelve |
|---|---|---|
| 1 | Permiso de escritura en `restrepothibas-debug/Ester` (agregar `epieyu1` como colaborador con permiso de escritura, o crear el repo bajo `epieyu1`) | Tú, desde GitHub |
| 2 | Referencia del proyecto Supabase (`https://<ref>.supabase.co` o el ID del dashboard) | Tú |
| 3 | Lenguaje del proyecto: TypeScript o JavaScript | Tú |
| 4 | Nombre de la tienda y logotipo (el PDF los declara pendientes) | Tú, antes de la Fase 3 |
| 5 | Decisión sobre Vercel Hobby vs alternativa y sobre el respaldo alternativo | Tú, con la comparación de Fase 2 delante |

---

## 5. Bitácora de esta auditoría

| Acción | Tipo | Efecto en sistemas |
|---|---|---|
| Consulta API del repositorio y permisos | lectura | ninguno |
| `gh auth status` | lectura local | ninguno |
| Verificación de versiones de Node/npm/git/supabase | lectura local | ninguno |
| Consulta de documentación de Supabase y Vercel | lectura web | ninguno |

Sin escrituras. Sin cambios en GitHub, Vercel ni Supabase.
