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

## Notas de incidentes

- **27/10/2026 — pérdida de contexto.** El agente anterior hizo trabajo real (análisis, auditoría, comparación, scaffold) pero terminó sin escribir en `MEMORY.md` ni en el diario. El propietario tuvo que pedir explícitamente la revisión. Por eso existe el protocolo de cierre en `AGENTS.md` §7. **No repetirlo.**
