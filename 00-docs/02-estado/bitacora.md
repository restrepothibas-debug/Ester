# Bitácora del proyecto

Registro cronológico. Una fila por sesión de trabajo. La columna **Escrituras** dice si se tocó algún sistema externo — si está en «ninguna», nada se modificó fuera de este workspace.

| Fecha | Agente | Acción | Resultado | Escrituras |
|---|---|---|---|---|
| 27/10/2026 22:24 | Agente anterior | Lectura completa del PDF (10 p.) y análisis de requisitos | `04-informes/analisis-especificacion-y-bloqueos.md` | ninguna |
| 27/10/2026 22:37 | Agente anterior | Auditoría Fase 1: API de GitHub, CLIs, workspace | Repo vacío, sin permiso de escritura, sin conectores. `04-informes/fase1-auditoria.md` | ninguna |
| 27/10/2026 22:38 | Agente anterior | Comparación React + Vite vs WordPress (§13) | Recomendación: React + Vite. `04-informes/fase2-comparacion-plataforma.md` | ninguna |
| 27/10/2026 22:45 | Agente anterior | Scaffold React + Vite + TS, tipos de dominio, cliente Supabase, tokens visuales | Proyecto compila. `App.tsx` sigue siendo plantilla | workspace local |
| 27/10/2026 22:58 | Agente anterior | Fin de sesión | **No actualizó `MEMORY.md` ni el diario**: el contexto se perdió | ninguna |
| 27/10/2026 23:00 | Accio | Verificación de traspaso: memoria, estado real, GitHub, Vercel, Supabase, PDF vs stack | `04-informes/verificacion-traspaso-2026-10-27.md`. Confirmados conflicto de backups y cláusula no comercial de Vercel Hobby | ninguna |
| 27/10/2026 23:05 | Accio | Reestructuración documental: `AGENTS.md`, `00-docs/` por áreas, registro de decisiones, estado y bitácora | Contexto del proyecto persistido para cualquier agente | workspace local |
| 27/10/2026 23:07 | Accio | Endurecimiento de `.gitignore` y creación de `.env.example` | Secretos excluidos del control de versiones antes de inicializar git | workspace local |
| 27/10/2026 23:20 | Accio | Recibido un PAT de GitHub de `restrepothibas-debug`; verificado por API (identidad, scopes y `permissions.admin: true` en `Ester`) | Token guardado fuera del workspace con permisos `600`. El llavero de macOS y `~/.config/gh` rechazaron la escritura | ninguna (solo lectura de API) |
| 27/10/2026 23:24 | Accio | Inicialización del repositorio git local (rama `main`) y primer commit | Commit `cc8a0a7`, 36 archivos, sin secretos ni `node_modules`/`dist` en el índice | workspace local |
| 28/10/2026 08:05 | Accio | Recibida la clave secreta de Supabase (`sb_secret_…`). Guardada en `.env.local` sin prefijo `VITE_` | Archivo con permisos `600`; `git check-ignore` confirma que está ignorado y `git status` no lo ve | workspace local |
| 28/10/2026 08:06 | Accio | El propietario acepta el riesgo del token de GitHub y pide usarlo sin rotarlo | Registrado como D-11, por decisión suya | ninguna |
| 28/10/2026 08:12 | Accio | Push de `main` a `restrepothibas-debug/Ester` con el PAT del propietario | 3 commits publicados; remoto verificado por API: 36 archivos, sin `.env.local` ni secretos | **GitHub: escritura** |
| 28/10/2026 08:14 | Accio | Respuestas del propietario: destino = `Ester`, «Gijo» = GitHub, tienda = «Dayara store» | Registradas como D-05, D-13 y D-14 | ninguna |
| 28/10/2026 08:30 | Accio | Recibidas la URL del proyecto Supabase y un valor de 16 caracteres sin etiqueta | URL verificada: proyecto vivo y **vacío** (0 tablas, 0 buckets). La clave secreta autentica. El valor de 16 caracteres quedó marcado como **sin identificar**, sin usarse | ninguna (solo lectura de API) |

## Notas de incidentes

- **27/10/2026 — pérdida de contexto.** El agente anterior hizo trabajo real (análisis, auditoría, comparación, scaffold) pero terminó sin escribir en `MEMORY.md` ni en el diario. El propietario tuvo que pedir explícitamente la revisión. Por eso existe el protocolo de cierre en `AGENTS.md` §7. **No repetirlo.**
