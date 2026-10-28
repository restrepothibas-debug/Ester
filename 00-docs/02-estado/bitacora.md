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
| 28/10/2026 08:45 | Accio | Recibida la clave publicable (`anon`); decodificado el JWT y probado el cliente | `role: anon`, `ref` correcto. Consulta real contra el proyecto: autentica y responde 404 por tabla inexistente, como corresponde | workspace local |
| 28/10/2026 08:55 | Accio | Fase 3 entregada: esquema de datos (12 tablas, RLS, índices, Storage) y mapa de páginas | `05-diseno/esquema-datos.md` y `05-diseno/mapa-paginas.md`. **Nada creado en la base** | workspace local |
| 28/10/2026 08:20 | Accio | Escritas las migraciones: esquema (13 tablas, enums, índices, `configuracion`) y RLS (políticas por rol + buckets) | `supabase/migrations/`. **No aplicadas**: sin `sbp_` ni conexión directa (el host `db.<ref>` no resuelve y no hay psql ni Docker) | workspace local |
| 28/10/2026 08:25 | Accio | Alineación de metadatos con la marca y README del proyecto | `dayara-store`, título y `lang="es"`, README reescrito. `npm run build` OK | workspace local |
| 28/10/2026 09:10 | Accio | Diagnosticada la vía de conexión: `db.<ref>` no resuelve; se probaron poolers por región hasta encontrar `aws-0-us-east-2`. El valor de 16 caracteres resultó ser la contraseña | Conexión Postgres establecida. Sin cambios en datos | ninguna |
| 28/10/2026 09:15 | Accio | Aplicadas las dos migraciones: esquema y RLS | 13 tablas, 13 con RLS, 23 políticas, 3 buckets, 5 filas de configuración | **Supabase: esquema creado** |
| 28/10/2026 09:20 | Accio | Verificación funcional: RLS como `anon`, lectura con clave de servidor y 6 restricciones de integridad en transacción con rollback | Todo conforme. Base sin datos de prueba | ninguna |
| 28/10/2026 09:25 | Accio | Tercera migración de control y script idempotente en Python | `migraciones_aplicadas` operativa; segunda ejecución reporta 0 pendientes | **Supabase: esquema** |
| 28/10/2026 10:05 | Accio | Cuarta migración: normalización de texto y slugs automáticos para marcas y productos | Reglas probadas: «Botas de Cuero Ámbar» → `botas de cuero ambar`; producto → `bota-ambar-sku-1` | **Supabase: esquema** |
| 28/10/2026 10:40 | Accio | Catálogo público: capa de consultas, 11 componentes, 6 rutas y hoja de estilos | `npm run build` y `lint` sin errores; solo 2 avisos de hooks | workspace local |
| 28/10/2026 10:50 | Accio | Verificación en navegador de las 4 rutas principales, en móvil y escritorio | Renderiza sin errores de consola ni de red. Estados vacíos correctos. Capturas revisadas | ninguna |
| 28/10/2026 10:58 | Accio | Corrección de alineación del hero y de la cabecera; nueva verificación | Hero alineado con las secciones, sin desbordamiento en 390px ni en 1280px | workspace local |
| 28/10/2026 11:20 | Accio | Quinta migración: trigger `perfil_al_crear_usuario` sobre `auth.users` + relleno de perfiles faltantes | Instalado y verificado. 0 usuarios y 0 perfiles: la cuenta aún no existe | **Supabase: esquema** |
| 28/10/2026 11:45 | Accio | Panel: capa de auth, guard por perfil, acceso, resumen y listado de productos | `build` y `lint` sin errores. Bundle 507 kB (aviso de tamaño) | workspace local |
| 28/10/2026 11:55 | Accio | Verificación en navegador del panel: redirección sin sesión, formulario, rechazo de credenciales, ausencia de registro | `/admin` y `/admin/productos` redirigen a `/admin/login`. Error mostrado: «Correo o contraseña incorrectos.» Sin errores de consola | ninguna |
| 28/10/2026 12:10 | Accio | Creado el usuario administrador con la API de administración de Auth (correo ya confirmado). El trigger creó su perfil | Perfil: nombre `Dayara`, rol `administrador`, activo. Sesión obtenida por `grant_type=password` | **Supabase: usuario de Auth** |
| 28/10/2026 12:15 | Accio | Prueba de escritura con la sesión de administrador: alta de una marca y borrado | 201 al crear (el slug se normalizó solo), 204 al borrar. `es_admin()` funciona a través de RLS | **Supabase: datos de prueba, ya eliminados** |
| 28/10/2026 12:20 | Accio | Verificación en navegador del panel con sesión real: acceso, resumen, productos, recarga, cierre de sesión y reintento | Todo correcto. Sin errores de consola | ninguna |
| 28/10/2026 13:05 | Accio | Módulos del panel: marcas, formulario de producto con tallas, inventario con historial; historial de precios automático al editar | `build` y `lint` sin errores (solo avisos de hooks) | workspace local |
| 28/10/2026 13:20 | Accio | Prueba de extremo a extremo en navegador: crear marca, crear producto QA-001, editar precio y talla, vender una unidad | Todo correcto: 4 movimientos de inventario, 1 registro de precio, historial coherente. Datos temporales eliminados al terminar | **Supabase: datos de prueba, ya eliminados** |
| 28/10/2026 13:35 | Accio | Carga diferida del panel y corrección de dos textos de estado vacío | Chunk del panel separado (`Acceso-*.js` 200). Portada y rutas públicas verificadas tras el cambio | workspace local |
| 28/10/2026 14:10 | Accio | Adoptado el método Gauntlet: documento del método, listón derivado del §18, registro de rondas y script de verificación | `00-docs/06-metodo/` + `scripts/verificar.sh`. El script detecta y luego descarta un falso positivo de `supabase-js` | workspace local |
| 28/10/2026 14:15 | Accio | `AGENTS.md` y la skill `catalogo-calzado` (que vive en el directorio de agentes, **fuera** del repositorio) exigen declarar las cuatro cajas y registrar rondas | El método queda activo en cada intervención, no solo en las grandes | workspace local y directorio de agentes |
| 28/10/2026 15:30 | Accio | Módulo de promociones: migración con reglas (una vigencia por producto, precio siempre menor), panel `/admin/promociones`, corrección de la vigencia en el catálogo y dos scripts de prueba | 12 casos SQL y 9 comprobaciones por API en 0 fallos; navegador real: crear, ver en catálogo, terminar y volver al precio normal. Dos defectos corregidos tras la prueba (bloqueo del precio por `step="100"` y catálogo que mostraba promociones terminadas). Datos de prueba eliminados | **Supabase: 1 migración aplicada y datos temporales borrados** |

## Notas de incidentes

- **27/10/2026 — pérdida de contexto.** El agente anterior hizo trabajo real (análisis, auditoría, comparación, scaffold) pero terminó sin escribir en `MEMORY.md` ni en el diario. El propietario tuvo que pedir explícitamente la revisión. Por eso existe el protocolo de cierre en `AGENTS.md` §7. **No repetirlo.**
