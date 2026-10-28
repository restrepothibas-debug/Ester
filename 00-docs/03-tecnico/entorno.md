# Entorno técnico

**Verificado:** 27/10/2026 en la máquina del propietario (`repeater.local`, macOS arm64, zona `America/Bogota`).

## Herramientas

| Herramienta | Versión | Nota |
|---|---|---|
| Node.js | v22.23.2 | Cumple el mínimo de Vite 8 |
| npm | 10.9.8 | Gestor del proyecto |
| git | 2.39.3 (Apple Git-146) | Repositorio local **aún no inicializado** |
| GitHub CLI (`gh`) | 2.45.0 | Autenticado como `epieyu1` |
| Supabase CLI | instalada (`/opt/homebrew/bin/supabase`) | **Sin sesión iniciada** |
| Vercel CLI | instalada (`/opt/homebrew/bin/vercel`) | **Sin sesión iniciada** |

## Proyecto

| Aspecto | Valor |
|---|---|
| Ruta | `~/Desktop/dayanara` |
| Nombre en `package.json` | `ester` (sin confirmar como nombre de marca) |
| Framework | React 19.3 + Vite 8.3 + TypeScript 7.0 |
| Ruteo | `react-router-dom` 7.18 |
| Cliente de datos | `@supabase/supabase-js` 2.118 |
| Lint | `oxlint` |
| Comandos | `npm run dev` · `npm run build` (`tsc -b && vite build`) · `npm run lint` · `npm run preview` |
| Compilación | ✅ Verificada sin errores el 27/10/2026 |

## Pendiente en el entorno

- Inicializar el repositorio git local (no existe `.git`).
- Autenticar Supabase CLI y enlazar el proyecto (`supabase link`).
- Autenticar Vercel CLI y crear el proyecto.
- Confirmar el plan de cada servicio antes de comprometer la arquitectura (PDF §16).

## Recordatorio de verificación

No dar por configurado nada de lo anterior sin comprobarlo en la sesión en curso. Este archivo documenta un estado, no una garantía: la fecha de verificación es lo que le da validez.
