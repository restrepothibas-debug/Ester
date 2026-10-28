# Fase 2 — React + Vite frente a WordPress (comparación exigida por §13)

**Fecha:** 27/10/2026
**Regla:** el PDF exige comparación explícita antes de decidir. Los costos que no pude verificar en fuente oficial quedan marcados como **por verificar**, no como cifra.

---

## 1. Comparación por criterio

| Criterio | React + Vite + Supabase | WordPress + WooCommerce |
|---|---|---|
| Catálogo público (inicio, marcas, filtros, ventana rápida, ficha) | Todo a medida: control exacto del diseño y del comportamiento, costo inicial alto | Se obtiene casi completo con tema + WooCommerce; el diseño premium exige tema y ajustes |
| Catálogo de marca **sin** pantalla intermedia de colecciones (§4) | Natural: se define la ruta | Depende de la estructura de WooCommerce (product_cat); hay que forzar la navegación |
| Panel: inventario por talla con cantidad exacta | Se diseña tal cual | WooCommerce maneja variaciones, pero el inventario por talla como entidad propia con historial requiere extensión |
| Panel: historial de inventario con cantidad anterior/nueva, motivo y responsable (§7) | Se construye | **No es nativo.** Requiere plugin de auditoría de stock (existencia y costo por verificar) o desarrollo propio |
| Panel: historial de precios con fecha y responsable (§9) | Se construye | No nativo; plugin o desarrollo |
| Panel: solicitudes de WhatsApp con estados y motivo de cancelación (§8) | Entidad propia, exacta al documento | No existe como tal: se modela con un CPT o plugin de pedidos manuales; encaje imperfecto |
| Flujo de WhatsApp sin crear pedido ni descontar (§8) | Control total del mensaje prellenado | Posible, pero WooCommerce presiona hacia el carrito/pedido que el alcance prohíbe |
| Estados de producto (5, §6) | Exactos | WooCommerce trae borrador/publicado/agotado; «pendiente de revisión» y «archivado» con el comportamiento descrito requieren ajuste |
| Seguridad: RLS por tabla, mínimo privilegio, 2FA, límite de intentos (§15) | RLS + Supabase Auth: se define y se prueba | Depende de plugins y del hosting; la superficie de ataque es mayor (núcleo + plugins + temas) |
| Copias de seguridad versionadas (§12) | A construir (ver conflicto de plan gratis en el informe de Fase 1) | Plugins de backup resuelven esto mejor y con menos trabajo |
| Mantenimiento | Dependencias npm y Supabase; actualizaciones controladas por ti | Núcleo + plugins + tema: actualizaciones frecuentes y riesgo de incompatibilidad |
| Hosting con presupuesto cero | Vercel Hobby **incumple** su cláusula no comercial (verificado). Alternativa a confirmar por escrito | Hosting gratuito existe, pero con subdominio o publicidad: incompatible con «boutique premium» |
| Importación CSV con vista previa y detección de duplicados (§11) | A construir, con las reglas exactas | Plugins de importación existen; la vista previa y la decisión de duplicados no siempre coinciden con lo pedido |
| Automatización de imágenes (§11, Fase 9) | Se integra como servicio aparte | Ecosistema de plugins de medios, menos control del criterio de confianza |

---

## 2. Lectura honesta

- **WordPress gana en velocidad de arranque** y en tareas ya resueltas (backups, editor de contenido, gestión de medios). Si el objetivo fuera publicar en dos semanas un catálogo estándar, sería la vía corta.
- **React + Vite gana en fidelidad al documento.** La mitad del PDF describe un panel que no existe en WooCommerce: historial de inventario con motivo y responsable, historial de precios, solicitudes manuales con estados propios, auditoría administrativa. En WordPress eso termina siendo código a medida sobre una base ajena: se paga dos veces, en plugins y en desarrollo.
- **Con presupuesto cero, WordPress tampoco es gratis**: hosting gratuito con publicidad o subdominio no sostiene una estética premium, y el hosting propio tiene costo mensual. React + Vite puede vivir en un plan gratuito de hosting estático (con la salvedad de Vercel Hobby ya señalada).

## 3. Recomendación

**React + Vite + Supabase**, que además es lo que ya decidiste al pedir crear el proyecto en el repositorio. Condiciones:

1. El panel se construye desde cero: es el mayor costo del proyecto y la razón por la que las fases 4 a 6 son las más largas.
2. Antes de producción hay que resolver dos cosas que el plan gratis no cubre: la cláusula comercial del hosting y las copias de seguridad versionadas.
3. Si en algún momento el presupuesto prioriza «tener algo publicado ya», la comparación se reabre con cifras de plugins verificadas.

## 4. Por verificar (no lo afirmo)

- Costo real de los plugins de WordPress necesarios para historial de stock, historial de precios y auditoría.
- Política comercial por escrito de un hosting estático gratuito alternativo a Vercel.
- Límites del plan gratuito para correo transaccional (alertas de §7/§63).
- Disponibilidad de 2FA (TOTP) en el plan Free de Supabase Auth: se confirma en Fase 4, antes de prometerlo.
