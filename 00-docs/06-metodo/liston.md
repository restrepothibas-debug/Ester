# Listón del proyecto

**Qué es:** la barra que el trabajo tiene que superar para darse por terminado. No es una guía de estilo ni una lista de deseos: cada línea se puede comprobar y el árbitro la marca una por una.
**Base:** §18 de la especificación («Criterios de aceptación y pruebas mínimas» y «Proceso de revisión exigido»), convertido en casillas.
**Método:** [`gauntlet.md`](gauntlet.md).

Marcas: **✔** cumple y está probado · **✘** no cumple · **—** no aplica todavía · **?** no comprobado.

> Regla: **? no es ✔**. Si no hay evidencia, no está hecho.

**Cómo se marca:** las casillas de los listones 0, A, B y E son el **catálogo de criterios**, y se dejan sin marcar. El marcado real se hace en el **Listón C**, módulo por módulo, citando el código de cada casilla y la evidencia usada. Así hay un solo sitio donde consta qué está probado.

---

## Listón 0 · Arranque de la intervención

Antes de tocar nada:

- [ ] Leí `AGENTS.md` y `02-estado/estado-actual.md`.
- [ ] La tarea está escrita en una frase (caja 1).
- [ ] Sé qué cajas del listón aplican a esta intervención.
- [ ] Si hay una ambigüedad que afecta datos, seguridad o arquitectura, la decisión está anotada como provisional o se preguntó.

---

## Listón A · Universal, para cualquier módulo

- [ ] A1 · `npm run build` termina en 0, sin errores de tipos.
- [ ] A2 · `npm run lint` sin errores. Cada aviso restante está justificado.
- [ ] A3 · Ningún secreto en archivos versionados ni en el bundle de `dist`.
- [ ] A4 · Cada ruta nueva se abre en un navegador real y **no lanza errores de consola**.
- [ ] A5 · Existen los tres estados: vacío, cargando y error. Ninguno deja la pantalla en blanco.
- [ ] A6 · Sin textos de relleno: ni «lorem», ni «imagen aquí», ni `TODO`, ni botones que no hacen nada.
- [ ] A7 · En 390 px no hay desbordamiento horizontal ni controles cortados.
- [ ] A8 · Si escribe datos, hay una prueba de que **sin rol administrador la escritura se rechaza**.
- [ ] A9 · Si un dato tiene historial (precio, inventario), la fila nueva en el historial **existe** después de la operación.
- [ ] A10 · `estado-actual.md`, `bitacora.md` y, si hubo decisión, `decisiones.md` están actualizados.

---

## Listón B · Por área (§18)

### Catálogo
- [ ] B1 · Navegación de marcas desde la cuadrícula hasta el catálogo de la marca.
- [ ] B2 · Búsqueda por modelo, referencia y color devuelve resultados coherentes.
- [ ] B3 · Filtros de talla, precio y modelo se combinan y quedan en la URL.
- [ ] B4 · Paginación: la página 2 no repite la 1 y el enlace conserva los filtros.
- [ ] B5 · Estados de disponibilidad: publicado con stock, agotado sin acción de solicitud.
- [ ] B6 · Responsive verificado en 390 px, 768 px y 1280 px.

### Producto
- [ ] B7 · Alta con datos mínimos obligatorios; el estado inicial es `pendiente_revision`.
- [ ] B8 · Edición conserva lo no editado y registra el cambio de precio en `historial_precios`.
- [ ] B9 · Tallas y cantidades: una fila por talla, sin duplicados.
- [ ] B10 · Fotografías: una principal, adicionales con orden — **pendiente, fuera de esta fase**.
- [ ] B11 · Los estados se pueden cambiar y el cambio se refleja en el catálogo público.

### Inventario
- [ ] B12 · Actualización por talla con cantidad anterior, nueva, motivo y responsable.
- [ ] B13 · Un ajuste sin motivo se rechaza.
- [ ] B14 · Al llegar a cero, el producto se ve como agotado.
- [ ] B15 · Archivar oculta del público y conserva en el panel.

### WhatsApp (§8)
- [ ] B16 · El mensaje incluye producto, referencia, talla y precio.
- [ ] B17 · Abrir WhatsApp **no** crea solicitud.
- [ ] B18 · Abrir WhatsApp **no** descuenta inventario.
- [ ] B19 · Sin número configurado, la interfaz lo dice; no hay enlace roto.

### Solicitudes
- [ ] B20 · Registro manual con producto, referencia, talla, precio, nombre, teléfono y fecha.
- [ ] B21 · Estados: pendiente, confirmada, cancelada. Cancelar exige motivo.
- [ ] B22 · Confirmar pregunta si se descuenta inventario; nunca descuenta solo.
- [ ] B23 · Acceso restringido: `anon` no puede leer solicitudes.

### Importación
- [ ] B24 · CSV/Excel válido entra; archivo inválido se rechaza con mensaje claro.
- [ ] B25 · Vista previa antes de aplicar y detección de duplicados.
- [ ] B26 · No aplica cambios parciales sin control.

### Seguridad
- [ ] B27 · Login con correo y contraseña; sin registro público.
- [ ] B28 · RLS activo en todas las tablas; `anon` sin acceso a datos privados.
- [ ] B29 · `service_role` fuera del cliente.
- [ ] B30 · 2FA — **pendiente**: requiere cuenta y configuración.
- [ ] B31 · Cierre por inactividad y límite de intentos — **pendiente**.
- [ ] B32 · Recuperación de contraseña por correo — **pendiente por decisión D-22**.

### Copias
- [ ] B33 · Exportación manual del catálogo.
- [ ] B34 · Copia diaria y versiones históricas — **no disponible en el plan actual** (conflicto §12 ya documentado).
- [ ] B35 · Restauración probada — **pendiente**.

### Calidad
- [ ] B36 · Build limpio (ver A1).
- [ ] B37 · Sin errores de consola en las rutas recorridas.
- [ ] B38 · Accesibilidad mínima: contraste, foco visible, navegación por teclado en diálogos y formularios.
- [ ] B39 · Rendimiento: el catálogo público no descarga el código del panel (verificado: chunks separados).
- [ ] B40 · Sin regresiones: las rutas anteriores siguen funcionando tras el cambio.

---

## Listón C · Estado real de lo construido

Lo que sigue no es aspiracional: es lo que está probado hoy, con la evidencia que se usó.

| Módulo | Probado | Sin probar |
|---|---|---|
| Catálogo público | B1, B3–B6 ✔ (navegador, 4 rutas, 390/1280 px) | **B2 ?** — la búsqueda solo se probó con la base vacía. Prueba pendiente: cargar productos de prueba y buscar por modelo, referencia y color |
| Panel · acceso | B27 ✔, B28 ✔, B29 ✔, B40 ✔ | B30, B31, B32 |
| Panel · marcas | A1, A4, A5, A8, A10 ✔ | B10 (logo) |
| Panel · productos | B7 ✔, B8 ✔, B9 ✔, B11 ✔, A9 ✔ (1 fila en `historial_precios`) | B10 |
| Panel · inventario | B12 ✔, B13 ✔, A9 ✔ (4 movimientos) | B14 con producto real en catálogo |
| Panel · promociones | E1–E10 ✔ · D-31, D-32 ✔ · **E8 ✔** comprobado en navegador y en la base (200.000 → 210.000 con promoción vigente deja fila en `historial_precios` con responsable) | Pendientes: aviso de promoción por vencer, historial de precios en pantalla y filtro del catálogo por precio vigente |
| Panel · solicitudes | Puntos 57–61 ✔: registro, confirmación con descuento y sin él, falta de existencias avisada, cancelación con motivo y devolución, borrado en dos pasos · `scripts/probar-solicitudes.py` (24 comprobaciones) · B37 ✔ (0 errores de consola) | **B6 ?** sin probar a 768 px · **B38 ?** sin revisar contraste ni foco en esta pantalla |
| Panel · destacados | B37 ✔ (0 errores de consola) · orden, duplicados y permisos con `scripts/probar-destacados.py` (11 comprobaciones) · el inicio respeta el orden | **B6 ✔** comprobado a 390, 768 y 1280 px tras el rediseño · **B38 ?** sin revisar teclado ni contraste en esta pantalla · sin fotografías todavía |
| WhatsApp | B19 ✔ | B16–B18 con número real |
| Solicitudes | B23 ✔ | B20–B22 |
| Importación / copias | — | Todo |

**Avisos de `lint` justificados:** los 5 avisos son `set-state-in-effect` en las consultas de datos, que es el patrón intencional de `useConsulta` (efecto con dependencias declaradas). No se silencian para no ocultar futuros avisos reales.

**Pruebas ejecutadas y su evidencia:** build en 0, lint sin errores, RLS rechazando escritura anónima (`42501`), 6 restricciones de integridad rechazando datos inválidos, recorrido de extremo a extremo en navegador con 4 movimientos de inventario y 1 de precio, y cero errores de consola.

**Promociones (28/10/2026):** `scripts/probar-reglas-promociones.py` → 16 casos contra la base, 0 fallos, sin dejar datos (`savepoint` + `rollback`). `scripts/probar-promociones-publico.py` → 9 comprobaciones por API con rol `anon`, 0 fallos, datos temporales borrados al final. Navegador real con sesión de administrador: crear, ver en el catálogo, terminar y comprobar que el catálogo vuelve al precio de lista. Dos defectos encontrados así —`step="100"` bloqueaba todo precio real y el catálogo no filtraba por vigencia— corregidos y re-probados.

---

## Listón D · Cierre de sesión

- [ ] D1 · `estado-actual.md` dice en qué fase quedamos y qué está bloqueado.
- [ ] D2 · `bitacora.md` tiene una fila con fecha, acción, resultado y si hubo escrituras externas.
- [ ] D3 · `rondas.md` registra cuántas rondas hubo, qué rechazó el árbitro y qué se corrigió.
- [ ] D4 · Las decisiones nuevas están en `decisiones.md`, con estado (aprobada / provisional / pendiente).
- [ ] D5 · `MEMORY.md` apunta a los archivos, sin duplicar su contenido.
- [ ] D6 · Los datos de prueba, si los hubo, fueron eliminados y se verificó su ausencia.

---

## Listón E · Promociones (siguiente módulo)

Escrito antes de construir, para que el árbitro tenga contra qué comparar.

**Debe cumplir:**

- [ ] E1 · Crear promoción **manual** (sin fecha final) y ver el precio promocional en el catálogo.
- [ ] E2 · Crear promoción **programada** con fecha final; al vencer, el catálogo vuelve al precio normal.
- [ ] E3 · El precio promocional **no** se copia en `productos`: vive solo en `promociones`.
- [ ] E4 · Al vencer, la promoción **no se borra**: sigue en la tabla y en el historial.
- [ ] E5 · Programada sin fecha final: rechazada por la base y mensaje legible en la interfaz.
- [ ] E6 · Fecha final anterior al inicio: rechazada.
- [ ] E7 · Precio promocional negativo: rechazado.
- [ ] E8 · Un cambio de precio normal durante una promoción queda en `historial_precios`.
- [ ] E9 · La promoción muestra fecha de inicio y fin en el panel, en zona `America/Bogota`.
- [ ] E10 · `anon` no puede crear ni modificar promociones (prueba por API).

**Decisiones que este módulo necesitaba antes de escribir código — resueltas el 28/10/2026:**

| Tema | Decisión |
|---|---|
| ¿Un producto puede tener dos promociones vigentes a la vez? | **No.** Una sola vigencia por producto; el solapamiento lo rechaza la base (D-31) |
| ¿Precio promocional mayor o igual al normal? | **Se bloquea**, no se advierte; también el igual, porque un descuento nulo no es una promoción (D-32) |
| Zona horaria del vencimiento | **`America/Bogota`**, confirmada por el propietario (D-34) |
| ¿La oferta de la semana es una promoción o una selección? | **Es una selección aparte**, no una promoción: módulo propio (D-33) |

---

## Qué cuenta como prueba

| Vale | No vale |
|---|---|
| Salida de comando pegada | «Debería compilar» |
| Respuesta HTTP con su código | «La ruta existe» |
| Fila leída de la base después de la operación | «El código la inserta» |
| Captura de la pantalla pedida, en el tamaño pedido | «Se ve bien en mi cabeza» |
| Prueba anónima que falla donde debe fallar | «RLS está configurado» |
