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
| §7/§63 disponibilidad y alertas | Un proyecto Supabase Free se pausa por inactividad (por confirmar antes de prometer nada) |

Fuentes: [Supabase Backups](https://supabase.com/docs/guides/platform/backups) · [Vercel Hobby](https://vercel.com/docs/plans/hobby)
