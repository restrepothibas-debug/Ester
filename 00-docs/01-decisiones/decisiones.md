# Registro de decisiones

**Regla:** una decisión solo entra aquí si el propietario la aprobó, o si viene cerrada en la especificación (§20, puntos 43–67). Lo que yo recomiendo no es una decisión: va marcado como *recomendado*.

Estados: ✅ Aprobada · ⏳ Pendiente · ❓ Sin identificar · 🔁 Reemplazada

---

## Decisiones de arquitectura y plataforma

| ID | Fecha | Decisión | Estado | Origen |
|---|---|---|---|---|
| D-01 | 27/10/2026 | Lenguaje **TypeScript** | ✅ | Propietario |
| D-02 | 27/10/2026 | Despliegue en **Vercel** | ✅ | Propietario |
| D-03 | 27/10/2026 | Base de datos **Supabase** | ✅ | Propietario + PDF p.1 |
| D-04 | 27/10/2026 | Frontend **React + Vite** (en lugar de WordPress) | ✅ implícita al fijar TS + Vite + Vercel | Propietario |
| D-05 | 28/10/2026 | «**Gijo**» significa **GitHub**. Queda cerrada la ambigüedad | ✅ | Propietario |
| D-06 | 27/10/2026 | Cliente Supabase solo con clave `anon`; `service_role` fuera del frontend | ✅ | PDF §15 |
| D-07 | — | Planes de Vercel y Supabase (Hobby/Free vs Pro) | ⏳ Pendiente | PDF §16 exige verificar costos |
| D-08 | 27/10/2026 | Repositorio **`restrepothibas-debug/Ester`** y acceso de escritura resuelto con un PAT del propietario del repo (permisos `admin` verificados por API) | ✅ | Propietario |
| D-09 | 27/10/2026 | Repositorio git **inicializado en local** (rama `main`), primer commit `cc8a0a7` | ✅ | Accio, sin push |
| D-10 | 27/10/2026 | Ramas y flujo de trabajo (main directo vs. ramas por módulo) | ⏳ Pendiente | — |
| D-11 | 28/10/2026 | **El propietario acepta el riesgo** del token de GitHub temporal y pide usarlo sin rotarlo por ahora. Registrado por decisión suya, no por recomendación técnica | ✅ | Propietario |
| D-12 | 28/10/2026 | La clave secreta de Supabase (`sb_secret_…`) se guarda en `.env.local` **sin** prefijo `VITE_` y no se usa en el cliente | ✅ | Accio, conforme a PDF §15 |
| D-15 | 28/10/2026 | Proyecto Supabase identificado: `pklqdjixkhpkmtrhtzsm` (`https://pklqdjixkhpkmtrhtzsm.supabase.co`), verificado vacío | ✅ | Accio, verificado por API |
| D-16 | 28/10/2026 | Clave publicable (`anon`) recibida y verificada (JWT `role: anon`, `ref` correcto, expira 2036-10-27). Cliente Supabase operativo | ✅ | Accio, verificado por API |
| D-29 | 28/10/2026 | Se adopta el **Gauntlet Prompt** como método obligatorio: bucle, árbitro adversarial y listón comprobable. Vive en `00-docs/06-metodo/` y es de lectura previa obligatoria | ✅ | Propietario + Accio |
| D-30 | 28/10/2026 | El listón del proyecto se deriva del **§18** de la especificación y se amplía con casillas propias. Se actualiza con cada módulo, antes de construirlo | ✅ | Accio |
| D-26 | 28/10/2026 | Cuenta administradora creada: **epieyualex01@gmail.com**, correo ya confirmado. El perfil lo creó el trigger automáticamente (rol `administrador`) | ✅ | Propietario + Accio |
| D-27 | 28/10/2026 | La contraseña inicial la generó Accio; **debe cambiarla el propietario**. No se guarda en ningún archivo del proyecto | ⏳ Pendiente de cambio | Accio |
| D-28 | 28/10/2026 | Origen de las imágenes de producto: **WhatsApp**. Medio de ingesta pendiente de definir; la comparación de opciones gratuitas, con fuentes oficiales, está en `04-informes/whatsapp-imagenes.md` | ⏳ Pendiente | Propietario |
| D-24 | 28/10/2026 | La cuenta administradora se crea **a mano** en Supabase Auth; un trigger crea el perfil con rol administrador al insertarse el usuario | ✅ | Propietario + Accio |
| D-25 | 28/10/2026 | La verificación de sesión se hace con la autenticación real de Supabase, sin simulaciones ni usuarios de prueba inventados | ✅ | Propietario |
| D-31 | 28/10/2026 | **Una sola promoción vigente por producto.** Dos vigencias del mismo producto no pueden solaparse; lo garantiza una restricción de exclusión en la base, no la interfaz. Una promoción abierta (sin fecha final) bloquea programar otra encima hasta que se le ponga fin. Las vencidas y terminadas se conservan | ✅ | Propietario |
| D-32 | 28/10/2026 | **El precio promocional nunca es igual ni superior al precio normal.** Se rechaza en la base en los dos sentidos: al guardar la promoción y al intentar bajar el precio normal por debajo de una promoción **vigente o programada**; también al reactivar una promoción cuyo precio dejó de ser menor. Lo que el propietario pidió fue «nunca más alto»; bloquear también el **igual** es criterio propio de Accio (un descuento nulo no es una promoción) y es revisable si el propietario lo pide | ✅ | Propietario + criterio de Accio |
| D-33 | 28/10/2026 | **La «oferta de la semana» no es una promoción**, es una selección: vive en `selecciones` con tipo `oferta_semana`, sin precio propio, y se gestionará en su propio módulo. `promociones` solo guarda descuentos con precio y vigencia | ✅ | Propietario |
| D-34 | 28/10/2026 | **Zona horaria del negocio: `America/Bogota`.** Los vencimientos se escriben y se leen en esa zona; la base guarda UTC. Sustituye al valor provisional de D-17 para promociones | ✅ | Propietario |
| D-35 | 28/10/2026 | **Destacados y oferta de la semana no tienen tope:** el administrador puede añadir los que quiera y ordenarlos a mano. El inicio muestra los 8 primeros destacados y las 4 primeras ofertas; el panel avisa cuando hay más y no bloquea | 🟨 Provisional | Accio |
| D-36 | 28/10/2026 | **Un mismo producto puede estar a la vez en destacados y en la oferta de la semana.** Son dos bloques distintos del inicio y no se excluyen entre sí | 🟨 Provisional | Accio |
| D-37 | 28/10/2026 | **Al cancelar una solicitud que descontó inventario, el administrador decide si se devuelve la unidad.** No se devuelve sola: el panel lo pregunta y la base lo hace en la misma operación que la cancelación | ✅ | Accio |
| D-38 | 28/10/2026 | **Las solicitudes se pueden borrar a mano en cualquier momento** (punto 59). En la interfaz el borrado va en dos pasos, exige confirmación y deja registro en `auditoria` | ✅ | Accio |
| D-39 | 28/10/2026 | **El precio de la solicitud es una copia congelada.** El panel propone el precio vigente (con promoción aplicada si la hay) y el administrador puede corregirlo; cambiarlo después en el producto no altera solicitudes anteriores | ✅ | Accio |
| D-40 | 28/10/2026 | **La tabla `solicitudes` no acepta escrituras directas.** Registrar, confirmar, cancelar y eliminar pasan por funciones que validan el estado y el inventario; un `UPDATE` a mano permitía devolver una solicitud a «pendiente» y descontar dos veces la misma unidad | ✅ | Accio |
| D-41 | 28/10/2026 | **El sistema visual se reconstruye sobre la referencia «Modern Style. Lasting Comfort»**, y esa imagen manda en lo visual: marfil cálido, tinta casi negra, verde profundo para acciones, serif de trazo fino en titulares y sans neutra en el resto, rejilla amplia y bordes finos. Sustituye la propuesta anterior de marfil/tierra/dorado, que nunca se aprobó | ✅ | Propietario |
| D-42 | 28/10/2026 | **Tipografías: Cormorant Garamond (titulares) e Inter (texto)**. La versión inicial las pedía a Google Fonts en cada visita; **sustituida por D-45**, que las sirve desde el propio proyecto | ♻️ Sustituida por D-45 | Accio |
| D-43 | 28/10/2026 | **La referencia manda en la forma; el proyecto manda en el contenido.** Todo lo que la imagen muestra y el negocio no tiene se sustituye, no se finge: sin carrito ni lista de deseos (§8), sin estrellas ni número de reseñas (no hay reseñas), sin alta en boletín (D-22), sin distintivos de pago (no hay pagos), sin métricas de conversión inventadas y sin fotos de banco que aparenten ser mercancía. En su lugar van garantías reales, el recorrido de compra, cifras del inventario y el texto de cierre por WhatsApp | ✅ | Accio |
| D-44 | 28/10/2026 | **El héroe es una sola diapositiva** mientras no haya una segunda con contenido propio; por eso no se dibuja el indicador 01/02 de la referencia. La foto del héroe es la del primer producto destacado y, mientras no existan fotografías (D-28), se usa el degradado cálido del sistema | ✅ | Accio |
| D-45 | 28/10/2026 | **La tipografía se autoaloja: cero peticiones a Google en tiempo de ejecución.** Los dos archivos `.woff2` (variables, un archivo por familia) viven en `public/fuentes/`, se sirven desde el mismo origen con caché inmutable de un año y se precargan en `index.html`. Se descargó solo el subconjunto `latin`, que cubre los acentos del español. El nombre de cada archivo lleva la versión de Google Fonts porque el contenido es inmutable en caché. Las licencias OFL viajan con los archivos. `./scripts/verificar.sh` falla si alguien vuelve a enlazar Google Fonts. SQLite no interviene aquí: el navegador no ejecuta SQLite y las fuentes no son datos de aplicación; el equivalente real es tener el archivo en el proyecto y servirlo desde el mismo dominio | ✅ | Propietario + criterio de Accio |
| D-46 | 28/10/2026 | **Las fotos se reducen en el navegador antes de subirlas.** El plan gratuito de Supabase no incluye transformación de imágenes y da 1 GB: una foto de móvil sin tocar pesa 3-5 MB (~250 fotos), reducida a WebP de 1600 px pesa ~200 kB (~5.000). Se guardan dos tamaños —1600 px para la ficha y 480 px para las tarjetas— porque si no cada listado descargaría la foto grande. El procesador local hace lo mismo para lotes | ✅ | Accio |
| D-47 | 28/10/2026 | **En la base se guarda la ruta del objeto, no la URL completa.** La URL se construye al leer (`src/lib/almacen.ts`), así cambiar de bucket o de dominio no exige tocar filas | ✅ | Accio |
| D-48 | 28/10/2026 | **Una foto no se repite dentro del mismo producto (sha256) y un producto con fotos tiene exactamente una principal.** La principal y el orden se cambian solo por funciones: el índice único parcial no es diferible y dos `UPDATE` desde el cliente no son atómicos | ✅ | Accio |
| D-49 | 28/10/2026 | **La comunidad de WhatsApp no se puede automatizar.** Verificado el 28/10/2026: no existe API de Comunidades; la Groups API solo crea **grupos propios** con **máximo 8 participantes** y exige *Official Business Account*; la coexistencia app+API **no sincroniza grupos**; y cualquier automatización no oficial está prohibida. La automatización se hará sobre el canal que elija el propietario (grupo propio, mensajes 1:1 o exportación manual), nunca leyendo la comunidad. Informe: `00-docs/04-informes/automatizacion-comunidad.md` | ✅ | Accio (con fuentes oficiales) |
| D-22 | 28/10/2026 | **El correo administrativo no se configura en este proceso.** Queda pendiente por decisión del propietario; sin él no se crea la cuenta de acceso ni se activa 2FA | ⏳ Pendiente por decisión | Propietario |
| D-23 | 28/10/2026 | Se adoptan los tokens visuales de `src/styles/tokens.css` para construir el catálogo: marfil, tierra, verde bosque y dorado; serif para titulares. Siguen siendo **propuesta** hasta aprobación | ⏳ Provisional | Accio, por delegación |
| D-20 | 28/10/2026 | El valor de 16 caracteres **era la contraseña de la base**. Región del proyecto: **us-east-2**. Conexión validada por el pooler | ✅ | Accio, verificado por conexión |
| D-21 | 28/10/2026 | Migraciones aplicadas directamente por conexión Postgres, con tabla `migraciones_aplicadas` para ejecución idempotente | ✅ | Accio |
| D-17 | 28/10/2026 | Valores operativos **provisionales**: moneda COP, zona `America/Bogota`, umbral de stock bajo 2, orden de tallas numérico, retención de auditoría 365 días. Viven en la tabla `configuracion`, no en el código, para cambiarlos sin desplegar | ⏳ Provisional | Accio, por delegación del propietario |
| D-18 | 28/10/2026 | Se añade `devolucion` como cuarto tipo de movimiento de inventario | ⏳ Provisional | Accio, por delegación del propietario |
| D-19 | 28/10/2026 | Metadatos alineados con la marca: `package.json` → `dayara-store`, `index.html` → `Dayara store` y `lang="es"` | ✅ | Accio |
| D-13 | 28/10/2026 | **Nombre de la tienda: «Dayara store»**. El logotipo sigue pendiente | ✅ | Propietario |
| D-14 | 28/10/2026 | El proyecto se publica en `restrepothibas-debug/Ester`, que es **público**: el código y la especificación quedan visibles para cualquiera. Riesgo aceptado por el propietario | ✅ | Propietario |

## Decisiones de producto ya cerradas en la especificación

Resumen de los 25 puntos aprobados en §20 (p.10). El detalle literal está en el PDF; esto es el índice.

| Punto | Decisión |
|---|---|
| 43 | Duplicados de producto: detectar coincidencias y **decide el administrador** (actualizar o crear nuevo) |
| 44 | Recuperación de contraseña por enlace al correo registrado |
| 45 | Promociones manuales y programadas con fecha final |
| 46 | Marca/modelo inciertos → pendiente de revisión, con corrección o reintento |
| 47 | El sistema puede sugerir tallas, pero el administrador verifica y completa cantidades |
| 48 | Precios editables individualmente o en lote, mostrando cambios antes de confirmar |
| 49 | Importación CSV/Excel y exportación del catálogo |
| 50 | Marca sugerida por el sistema, confirmada por el administrador antes de crearla |
| 51 | Agotados pueden archivarse; archivados quedan ocultos y conservados |
| 52 | El administrador elige foto principal y ordena las adicionales |
| 53 | Color sugerido desde la foto, confirmado o corregido; entrada manual disponible |
| 54 | Productos destacados seleccionados manualmente |
| 55 | Inventario actualizable individualmente o en lote, con historial |
| 56 | El historial incluye cantidad anterior/nueva, fecha, motivo, responsable y tipo de movimiento |
| 57 | Solicitudes de WhatsApp registradas manualmente; estados pendiente, confirmada, cancelada |
| 58 | La solicitud incluye producto, referencia, talla, precio, estado, nombre/teléfono, fecha, observaciones y motivo de cancelación |
| 59 | Las solicitudes se conservan indefinidamente hasta eliminación manual |
| 60 | Al confirmar una solicitud, el panel pregunta si descuenta unidades |
| 61 | Si las existencias no alcanzan, avisar y dejar decidir al administrador |
| 62 | Seguridad: protección contra intentos repetidos, cierre por inactividad y 2FA |
| 63 | Alertas importantes en el panel y por correo |
| 64 | Alertas de cantidades bajas, agotados y cambios de inventario |
| 65 | Cambios de precio con confirmación e historial |
| 66 | Copias automáticas, exportación manual y restauración desde el panel, previa verificación técnica |
| 67 | Copias automáticas diarias y múltiples versiones históricas; retención exacta **pendiente** |

## Decisiones pendientes del propietario

Todo lo de abajo está declarado pendiente en el PDF §16 o surgió de la auditoría. **No se implementa nada de esto por suposición.**

| Tema | Qué debe definir |
|---|---|
| Nombre y logotipo de la tienda | Marca definitiva o provisional. Hoy el proyecto dice `ester` y el repo GitHub se describe como «portafolio de Ester» — **no coincide con un catálogo de calzado** |
| Datos de contacto | Número de WhatsApp y correo administrativo |
| Zona horaria | Para vencimiento de promociones y alertas (el equipo está en `America/Bogota`; no confirmado para el negocio) |
| Tipografía y valores exactos de color | Hoy `src/styles/tokens.css` contiene una **propuesta**, no una aprobación |
| Umbrales de inventario | Cantidad por talla para alerta de nivel bajo y control de frecuencia |
| Retención de copias | Duración, ubicación, cifrado y pruebas de restauración |
| Datos personales | Aviso y tratamiento de datos de las solicitudes; conservación y eliminación |
| Presupuesto | El informe de Fase 1 registra presupuesto **cero**. Si sigue así, hay que decidir postura frente a los dos conflictos de plan gratuito |
| Base local | ¿Se aprovecha el scaffold actual (`ester`, plantilla Vite) o se parte de cero con otro nombre? |

## Conflictos detectados entre el PDF y los planes gratuitos

Verificados en documentación oficial el 27/10/2026. **No son recomendaciones de pago: son requisitos del PDF que los planes gratuitos no cubren.**

| Requisito | Situación |
|---|---|
| §12 copias diarias automáticas | Supabase respalda automáticamente solo en Pro, Team y Enterprise |
| §12 copia completa restaurable | Los backups de base de datos no incluyen los objetos de Storage (fotos) |
| §12 restauración desde el panel | No existe en Free; habría que construirla |
| Despliegue del sitio | Vercel Hobby se limita a «uso personal no comercial» |
| §10 y punto 63 disponibilidad y alertas | Un proyecto Supabase Free se pausa por inactividad (por confirmar antes de prometer nada) |

Fuentes: [Supabase Backups](https://supabase.com/docs/guides/platform/backups) · [Vercel Hobby](https://vercel.com/docs/plans/hobby)
