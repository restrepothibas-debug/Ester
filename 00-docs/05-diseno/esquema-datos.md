# Esquema de datos — propuesta para aprobación

**Estado:** propuesta. **Nada de esto está creado en la base.** El proyecto Supabase sigue con 0 tablas.
**Fase:** 3 (diseño funcional). Se aprueba antes de escribir migraciones, como exige §19.
**Base:** §6, §7, §8, §9, §14 y los puntos 43–67 del PDF. Donde el PDF no define algo, se marca **PENDIENTE** en lugar de inventarlo.

---

## 1. Criterios que gobiernan el diseño

1. **Nada se publica solo.** El estado por defecto de un producto es `pendiente_revision`; el borrador y la publicación son actos del administrador.
2. **El historial no se sobrescribe.** Cambios de inventario y de precio generan fila; nunca se actualiza un registro anterior.
3. **La apertura de WhatsApp no escribe nada.** La tabla `solicitudes` solo recibe filas creadas por el administrador.
4. **Todo lo financiero es `numeric`, nunca `float`.**
5. **Los datos personales se minimizan:** de la solicitud solo se guarda nombre, teléfono y observaciones.

## 2. Tipos enumerados

```sql
estado_producto      : pendiente_revision | borrador | publicado | agotado | archivado
tipo_movimiento      : entrada | venta | ajuste | devolucion
tipo_precio          : normal | promocional
tipo_promocion       : manual | programada
estado_solicitud     : pendiente | confirmada | cancelada
tipo_seleccion       : destacado | oferta_semana
rol_admin            : administrador
```

`devolucion` no aparece literalmente en el PDF, que habla de «entradas de mercancía, ventas y ajustes por errores». Se propone como cuarto tipo porque una devolución no es ninguna de las tres. **PENDIENTE de aprobación**; si no se aprueba, se elimina y las devoluciones se registran como `entrada`.

## 3. Tablas

### 3.1 `perfiles` — cuenta administradora

Entidad **no listada** en §14 pero indispensable: el PDF exige login, 2FA y una sola cuenta. Se apoya en `auth.users` (que gestiona Supabase Auth) y guarda solo lo propio de la aplicación.

| Columna | Tipo | Regla |
|---|---|---|
| `id` | `uuid` PK | = `auth.users.id` |
| `nombre` | `text` | — |
| `rol` | `rol_admin` | `administrador` |
| `activo` | `boolean` | por defecto `true` |
| `creado_en` | `timestamptz` | `now()` |

No se guardan contraseñas: las administra Supabase Auth (§15).

### 3.2 `marcas`

| Columna | Tipo | Regla |
|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `nombre` | `text` | visible |
| `nombre_normalizado` | `text` UNIQUE | minúsculas, sin tildes ni espacios dobles — evita duplicados por variaciones de escritura (§11) |
| `logo_ruta` | `text` | nullable |
| `activa` | `boolean` | `true` |
| `creado_en`, `actualizado_en` | `timestamptz` | — |

### 3.3 `productos`

| Columna | Tipo | Regla |
|---|---|---|
| `id` | `uuid` PK | — |
| `codigo_interno` | `text` UNIQUE | obligatorio; distinto de la referencia comercial (§6) |
| `marca_id` | `uuid` FK → `marcas` | `on delete restrict` — no se borra una marca con productos |
| `modelo` | `text` | obligatorio |
| `referencia` | `text` | nullable; referencia comercial |
| `color` | `text` | nullable; sugerido y confirmado por el administrador (§53) |
| `precio_normal` | `numeric(12,2)` | `>= 0` |
| `estado` | `estado_producto` | por defecto `pendiente_revision` |
| `slug` | `text` UNIQUE | para la URL de la ficha |
| `publicado_en` | `timestamptz` | nullable |
| `creado_en`, `actualizado_en` | `timestamptz` | — |

`precio_promocional` **no vive aquí**: los descuentos son registros de `promociones`, con vigencia. Duplicar el precio en dos sitios genera precios contradictorios, que el §9 prohíbe.

### 3.4 `producto_imagenes`

| Columna | Tipo | Regla |
|---|---|---|
| `id` | `uuid` PK | — |
| `producto_id` | `uuid` FK → `productos` | `on delete cascade` |
| `ruta` | `text` | ruta dentro del bucket |
| `principal` | `boolean` | exactamente una por producto (índice único parcial) |
| `orden` | `integer` | `>= 0` |
| `creado_en` | `timestamptz` | — |

Índice parcial: `unique (producto_id) where principal` → garantiza «una principal obligatoria» en la práctica (la obligatoriedad de *existir* se valida en la aplicación antes de publicar).

### 3.5 `producto_tallas` — inventario por talla

| Columna | Tipo | Regla |
|---|---|---|
| `id` | `uuid` PK | — |
| `producto_id` | `uuid` FK → `productos` | `on delete cascade` |
| `talla` | `text` | `36`, `37.5`, `S`… |
| `cantidad` | `integer` | `>= 0`, por defecto `0` |
| `actualizado_en` | `timestamptz` | — |

`unique (producto_id, talla)`. **PENDIENTE:** orden de presentación de tallas (numérico en Colombia, texto en otros mercados). Mientras no se defina, se ordena por `talla` como texto y el administrador decide el sistema.

### 3.6 `movimientos_inventario`

| Columna | Tipo | Regla |
|---|---|---|
| `id` | `uuid` PK | — |
| `producto_id` | `uuid` FK | `on delete restrict` |
| `talla` | `text` | — |
| `cantidad_anterior` | `integer` | `>= 0` |
| `cantidad_nueva` | `integer` | `>= 0` |
| `tipo` | `tipo_movimiento` | — |
| `motivo` | `text` | obligatorio en `ajuste` |
| `responsable_id` | `uuid` FK → `perfiles` | quién lo hizo (§7) |
| `creado_en` | `timestamptz` | — |

Solo inserción. Sin `update` ni `delete` para el rol de aplicación: un historial que se puede editar no es historial.

### 3.7 `historial_precios`

| Columna | Tipo | Regla |
|---|---|---|
| `id` | `uuid` PK | — |
| `producto_id` | `uuid` FK | `on delete restrict` |
| `campo` | `tipo_precio` | `normal` o `promocional` |
| `valor_anterior` | `numeric(12,2)` | — |
| `valor_nuevo` | `numeric(12,2)` | — |
| `responsable_id` | `uuid` FK → `perfiles` | — |
| `creado_en` | `timestamptz` | — |

### 3.8 `promociones`

| Columna | Tipo | Regla |
|---|---|---|
| `id` | `uuid` PK | — |
| `producto_id` | `uuid` FK | `on delete cascade` |
| `precio_promocional` | `numeric(12,2)` | `>= 0` |
| `tipo` | `tipo_promocion` | — |
| `inicia_en` | `timestamptz` | `now()` por defecto |
| `termina_en` | `timestamptz` | nullable; **obligatorio si `tipo = programada`** |
| `activa` | `boolean` | `true` |
| `creado_por` | `uuid` FK → `perfiles` | — |
| `creado_en` | `timestamptz` | — |

CHECK: `termina_en is null or termina_en > inicia_en`.
**El vencimiento no borra nada:** la promoción sigue en la tabla y deja de mostrarse porque `termina_en < now()`. El historial de precios permanece intacto (§9).
**PENDIENTE:** zona horaria de referencia para el vencimiento — el PDF §16 lo exige y no está definido.

### 3.9 `selecciones` — destacados y ofertas de la semana

| Columna | Tipo | Regla |
|---|---|---|
| `id` | `uuid` PK | — |
| `producto_id` | `uuid` FK | `on delete cascade` |
| `tipo` | `tipo_seleccion` | — |
| `orden` | `integer` | — |
| `activo` | `boolean` | `true` |
| `creado_en` | `timestamptz` | — |

`unique (producto_id, tipo)`: un producto no puede estar dos veces en la misma selección.

### 3.10 `solicitudes` — registro manual de WhatsApp

| Columna | Tipo | Regla |
|---|---|---|
| `id` | `uuid` PK | — |
| `producto_id` | `uuid` FK | nullable: la solicitud sobrevive si el producto se archiva |
| `referencia_snapshot` | `text` | copia del modelo/referencia al momento del registro |
| `talla` | `text` | — |
| `precio_snapshot` | `numeric(12,2)` | el precio que se cotizó, congelado |
| `estado` | `estado_solicitud` | `pendiente` |
| `cliente_nombre` | `text` | — |
| `cliente_telefono` | `text` | — |
| `observaciones` | `text` | nullable |
| `motivo_cancelacion` | `text` | obligatorio si `estado = cancelada` |
| `inventario_descontado` | `boolean` | `false`; pasa a `true` solo si el administrador confirma el descuento (§60) |
| `creado_en`, `actualizado_en`, `confirmada_en` | `timestamptz` | — |

Los `_snapshot` existen porque un historial de ventas que cambia cuando el administrador edita un precio no sirve para nada. Se conservan indefinidamente hasta eliminación manual (§59).

### 3.11 `notificaciones`

| Columna | Tipo | Regla |
|---|---|---|
| `id` | `uuid` PK | — |
| `tipo` | `text` | `stock_bajo`, `agotado`, `solicitud`, `importacion`… |
| `severidad` | `text` | `info`, `aviso`, `critico` |
| `titulo`, `cuerpo` | `text` | — |
| `producto_id` | `uuid` FK | nullable |
| `leida` | `boolean` | `false` |
| `enviada_correo_en` | `timestamptz` | nullable |
| `creado_en` | `timestamptz` | — |

**PENDIENTE:** umbral de stock bajo y frecuencia de avisos (§16). Sin esos valores la tabla funciona, pero la regla que la alimenta no se puede escribir.

### 3.12 `auditoria`

| Columna | Tipo | Regla |
|---|---|---|
| `id` | `uuid` PK | — |
| `actor_id` | `uuid` FK → `perfiles` | — |
| `accion` | `text` | `producto.publicado`, `precio.editado`, `solicitud.eliminada`… |
| `entidad` | `text` | tabla afectada |
| `entidad_id` | `uuid` | — |
| `datos` | `jsonb` | solo lo necesario; **sin datos personales ni secretos** |
| `creado_en` | `timestamptz` | — |

## 4. Relaciones

```
marcas 1 ──< productos 1 ──< producto_imagenes
                        ├──< producto_tallas
                        ├──< movimientos_inventario
                        ├──< historial_precios
                        ├──< promociones
                        ├──< selecciones
                        └──< solicitudes

perfiles 1 ──< movimientos_inventario / historial_precios / auditoria
```

## 5. Índices previstos

| Índice | Para qué |
|---|---|
| `productos (estado)` | el catálogo público filtra por `publicado` |
| `productos (marca_id, estado)` | catálogo por marca |
| `productos (codigo_interno)` único | identidad |
| `productos (slug)` único | URL de la ficha |
| `marcas (nombre_normalizado)` único | evitar duplicados por escritura |
| `producto_tallas (producto_id, talla)` único | una fila por talla |
| `producto_tallas (producto_id) where cantidad > 0` | «solo se muestran tallas con existencias» |
| `movimientos_inventario (producto_id, creado_en desc)` | historial |
| `historial_precios (producto_id, creado_en desc)` | historial |
| `solicitudes (estado, creado_en desc)` | bandeja de pendientes |
| `notificaciones (leida) where leida = false` | contador del dashboard |
| `GIN pg_trgm` sobre `modelo`, `referencia`, `color` | búsqueda con sugerencias |

## 6. Políticas RLS — matriz propuesta

Regla base: **`anon` solo lee lo público; `authenticated` con rol administrador hace todo; nada se escribe desde el cliente anónimo.**

| Tabla | `anon` (público) | `authenticated` administrador |
|---|---|---|
| `productos` | `select` solo si `estado in ('publicado','agotado')` | todo |
| `marcas` | `select` solo si `activa` | todo |
| `producto_imagenes` | `select` si el producto es visible | todo |
| `producto_tallas` | `select` si el producto es visible | todo |
| `promociones` | `select` si `activa` y vigente por fecha | todo |
| `selecciones` | `select` si `activo` | todo |
| `movimientos_inventario` | **sin acceso** | `select` e `insert`; sin `update`/`delete` |
| `historial_precios` | **sin acceso** | `select` e `insert`; sin `update`/`delete` |
| `solicitudes` | **sin acceso** | todo |
| `notificaciones` | **sin acceso** | todo |
| `auditoria` | **sin acceso** | `select` e `insert` |
| `perfiles` | **sin acceso** | `select` propio |

Detalle importante: la visibilidad pública se calcula en la política, **no** en el frontend. Ocultar un producto solo en React no lo oculta de la API.

## 7. Storage

| Bucket | Público | Lectura | Escritura |
|---|---|---|---|
| `productos` | sí (solo lectura) | cualquiera | solo administrador autenticado |
| `marcas` | sí | cualquiera | solo administrador autenticado |
| `copias` | **no** | nadie desde la API | solo proceso de respaldo |

Las fotos se sirven desde el bucket público; los respaldos nunca. Coherente con §12 y §15.

## 8. Decisiones pendientes que este esquema necesita

| Tema | Por qué bloquea |
|---|---|
| Moneda y formato de precio | `numeric(12,2)` asume dos decimales; el peso colombiano se maneja sin ellos. Cambia la presentación |
| Zona horaria | vencimiento de promociones y «ofertas de la semana» |
| Umbral de stock bajo | alimenta `notificaciones` |
| Orden de tallas | numérico vs. alfabético |
| Tipo `devolucion` | si se aprueba o se reemplaza por `entrada` |
| Retención de `auditoria` y `solicitudes` | §16 lo deja abierto |

Ninguna de estas impide crear la estructura; todas impiden terminarla bien. Se resuelven antes de la primera migración.
