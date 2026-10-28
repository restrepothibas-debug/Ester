# AGENTS.md — Catálogo digital de calzado

> **Punto de entrada obligatorio.** Cualquier agente, IA o persona que entre a este proyecto debe leer este archivo completo antes de ejecutar una sola acción. Si algo de aquí contradice a un documento de `00-docs/`, gana el documento más específico; si algo no está escrito en ningún lado, **se pregunta al propietario, no se asume**.

---

## 0. Método obligatorio en cada intervención

El proyecto usa el **Gauntlet Prompt**: [`00-docs/06-metodo/gauntlet.md`](00-docs/06-metodo/gauntlet.md). No es una sugerencia de estilo; es la forma de trabajar.

Toda intervención declara cuatro cajas, en dos líneas si hace falta:

1. **TAREA** — qué se pide, en una frase.
2. **MÉTODO** — autónomo, **en bucle** (no se entrega la primera versión) y con un **árbitro adversarial** que no participó y no puede elogiar.
3. **LISTÓN** — los criterios comprobables de [`00-docs/06-metodo/liston.md`](00-docs/06-metodo/liston.md). **Sin casillas marcadas no hay entrega.**
4. **ENTREGABLE** — archivos, pruebas ejecutadas, resultado real, **resumen de rondas** (qué se rechazó y qué se corrigió), limitaciones.

El árbitro es el subagente `verification`, con mandato de encontrar fallos. **Quien construye no aprueba.** Cada ronda se registra en [`00-docs/06-metodo/rondas.md`](00-docs/06-metodo/rondas.md).

Antes de entregar, ejecutar `./scripts/verificar.sh` (compilación, lint, credenciales, textos de relleno). Lo que exige navegador o criterio lo cubre el árbitro.

---

## 1. Qué es este proyecto

**Tienda: «Dayara store»** (nombre definido el 28/10/2026; logotipo pendiente).

Catálogo digital de calzado con estética de boutique premium, detalles navideños discretos y experiencia mobile-first. Dos caras:

- **Catálogo público:** inicio, marcas, catálogo por marca, búsqueda, filtros, paginación, ventana rápida, ficha de producto y preparación de mensaje para WhatsApp.
- **Panel privado:** productos, marcas, fotografías, tallas e inventario, precios y promociones, destacados, solicitudes registradas manualmente, historial, alertas, importación/exportación, copias de seguridad.

**No hay pago en línea, ni carrito, ni creación automática de pedidos.** El negocio se cierra por WhatsApp. Abrir WhatsApp **no** crea un registro ni descuenta inventario.

## 2. Fuente de verdad

| Documento | Rol |
|---|---|
| `Especificacion_Proyecto_Catalogo_Zapatos.pdf` | **Especificación original del propietario.** 10 páginas. No se modifica ni se sobrescribe |
| `00-docs/00-contexto/` | Contexto destilado: qué es, alcance, entidades, estados |
| `00-docs/01-decisiones/decisiones.md` | Decisiones tomadas, con fecha y estado (aprobada / pendiente) |
| `00-docs/02-estado/estado-actual.md` | **En qué fase estamos y qué está bloqueado.** Es lo primero que se actualiza |
| `00-docs/02-estado/bitacora.md` | Historia cronológica de lo que se hizo y se verificó |
| `00-docs/03-tecnico/` | Entorno, variables de entorno, reglas de secretos |
| `00-docs/04-informes/` | Informes largos ya emitidos (auditoría, comparación, verificación) |
| `00-docs/05-diseno/` | Esquema de datos y mapa de páginas (Fase 3), pendientes de aprobación |
| `00-docs/06-metodo/` | **Método Gauntlet, listón del proyecto y registro de rondas.** Se lee antes de trabajar |

Regla: **el PDF manda.** Si el código hace algo que el PDF no autoriza, el código está mal.

## 3. Stack

| Capa | Decisión (ver `decisiones.md`) |
|---|---|
| Lenguaje | **TypeScript** |
| Frontend | React 19 + Vite 8 (`react-router-dom` para rutas) |
| Base de datos, auth y archivos | **Supabase** (Postgres + Auth + Storage) |
| Despliegue | **Vercel** |
| Repositorio | GitHub (pendiente de resolver permiso de escritura) |

## 4. En qué fase estamos

**Fase 1** ✅ cerrada · **Fase 2** ✅ cerrada a favor de React + Vite · **Fase 3** 🟨 documentada y en uso; la aprobación formal del propietario sigue pendiente · **Fase 4** 🟨 RLS aplicado y sesión verificada; faltan 2FA, límite de intentos e inactividad · **Fase 5** ✅ construida y verificada en navegador, con dos criterios del listón sin probar (B2 por falta de datos, B16–B18 por falta de número) · **Fase 6** 🟨 en curso: marcas, productos e inventario listos; faltan fotos, promociones, destacados y solicitudes.

Detalle, bloqueos y siguiente paso: `00-docs/02-estado/estado-actual.md`. No lo deduzcas: léelo.

## 5. Reglas no negociables (PDF §19)

1. **No inventar** nombre de tienda, teléfono, correo, cantidades, precios, marcas, productos ni configuraciones de infraestructura.
2. **No asumir** que Supabase, Vercel o GitHub están bien configurados porque el proyecto exista. Se verifica antes de usarlo.
3. **Auditar antes de modificar.** Inspeccionar el repositorio y el proyecto Supabase antes de crear tablas o tocar archivos.
4. **Etiquetar el origen de cada afirmación:** confirmado · observado en código/configuración · pendiente de referencia · recomendado.
5. **No hay migraciones destructivas ni restauraciones** sin respaldo, revisión y autorización explícita.
6. **No publicar** productos con datos incompletos o dudosos.
7. **Nada de secretos en el cliente.** `service_role` jamás en el bundle ni en variables `VITE_*`. Ocultar botones no es seguridad: la autorización se aplica en base de datos (RLS).
8. **Ante ambigüedad** que afecte arquitectura, datos, seguridad o comportamiento: **preguntar**, no asumir.

## 6. Secretos y credenciales

- Los valores reales viven en **`.env.local`** (ignorado por git) y en **Vercel → Settings → Environment Variables**.
- `.env.example` documenta **nombres**, nunca valores.
- Nunca pegar credenciales en documentos de `00-docs/`, en el código, en commits, en capturas o en mensajes de chat.
- Detalle completo: `00-docs/03-tecnico/variables-entorno.md`.

## 7. Protocolo de cierre de sesión (obligatorio)

Ninguna sesión termina sin actualizar la documentación. Si no se hace, el siguiente agente pierde el contexto — esto ya pasó una vez.

1. `00-docs/02-estado/estado-actual.md` — qué cambió, en qué fase quedamos, qué quedó bloqueado.
2. `00-docs/02-estado/bitacora.md` — una fila con fecha, acción, resultado y si hubo escritura en sistemas externos.
3. `00-docs/01-decisiones/decisiones.md` — si el propietario decidió algo nuevo, se registra con fecha y estado.
4. `00-docs/03-tecnico/` — si cambió el entorno, una variable o un procedimiento.
5. `00-docs/06-metodo/rondas.md` — cuántas rondas hubo, qué rechazó el árbitro y qué se corrigió.
6. Memoria del agente (`MEMORY.md`) — solo el resumen de alto valor, apuntando a estos archivos.

## 8. Cómo trabajar aquí

- El diseño funcional y el esquema de datos están documentados y **en uso** (Fase 3): la base ya tiene el esquema aplicado y cada módulo nuevo se construye contra él, **añadiendo su listón en `06-metodo/liston.md` antes de escribir código**.
- Cada módulo se entrega con su prueba; **revisar visualmente no es verificar**.
- Un módulo se considera terminado cuando compila, funciona, protege los datos y pasa sus pruebas mínimas (PDF §18).
- Al cerrar un módulo: reportar archivos modificados, pruebas ejecutadas, resultados, limitaciones y pendientes.
