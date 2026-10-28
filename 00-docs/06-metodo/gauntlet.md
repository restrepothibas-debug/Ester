# Método de trabajo: Gauntlet Prompt

**Origen:** `guia-gauntlet-prompt.pdf` (Xavier Mitjana, «IA en Acción»), 19 páginas, aportado por el propietario el 28/10/2026. **La guía no se copia al repositorio**: es material de terceros y el repositorio es público. Este documento es la adaptación; si hace falta cotejar el original, se pide al propietario.
**Estado:** activo. Se aplica en **cada intervención**, no solo en las grandes.

---

## 1. Qué problema resuelve

La IA entrega la primera versión, se ve razonable y se acepta. El problema no es la capacidad: es que nadie revisa con criterio estricto, porque revisar cansa. La IA no se cansa.

La guía lo dice de dos formas que importan aquí:

- **La IA es mala jueza de su propio trabajo.** Anthropic lo comprobó: cuando una IA evalúa lo que acaba de hacer, tiende a aprobarlo aunque sea mediocre. Por eso quien hace no puede ser quien juzga.
- **El listón es el punto de control.** Sin un listón concreto, el bucle no sabe cuándo parar; con un listón bajo, se para enseguida.

Esto coincide con el §18 de la especificación del proyecto, que ya exigía: *«diseñar → implementar → probar → auditar adversarialmente → corregir → volver a probar → aprobar»* y prohíbe *«declarar una función como verificada si solo se revisó visualmente»*. El Gauntlet le pone estructura a esa exigencia.

## 2. Las cuatro cajas

Toda intervención se declara antes de empezar, aunque sea en dos líneas.

### Caja 1 · TAREA — ¿qué se pide?
En una o dos frases. Para quién y qué piezas incluye.

### Caja 2 · MÉTODO — ¿cómo se trabaja?
Tres frases, siempre las mismas:

1. **De forma autónoma.** No se pregunta cada dos pasos. Si algo es ambiguo, se decide y **se deja anotado** en [`../01-decisiones/decisiones.md`](../01-decisiones/decisiones.md) como provisional.
2. **En bucle.** Planificar, construir, probar, revisar, corregir y repetir. **No se entrega la primera versión.**
3. **Con un árbitro adversarial.** Un revisor que no participó en el trabajo y cuya única misión es encontrar fallos. No puede elogiar: cada objeción dice qué está mal, dónde y cómo debería estar.

### Caja 3 · LISTÓN — ¿cuándo está terminado?
Los criterios comprobables. Viven en [`liston.md`](liston.md). **El árbitro no aprueba nada que no esté marcado casilla por casilla.**

Regla de oro: *«cada cifra coincide con su documento»* sirve; *«que quede bonito»* no. Si el criterio no se puede verificar, no es un criterio.

### Caja 4 · ENTREGABLE — ¿qué se recibe?
Formato y restricciones que no se discuten:
- Archivos modificados y por qué.
- Pruebas ejecutadas y su resultado real.
- **Resumen de la revisión: cuántas rondas, qué se rechazó y qué se corrigió.**
- Limitaciones y asuntos pendientes.
- Sin datos inventados y sin declarar verificado lo que no se probó.

## 3. El árbitro, en este proyecto

No es una metáfora: es el subagente `verification`, con un encargo escrito.

**Reglas del árbitro:**

| Regla | Consecuencia práctica |
|---|---|
| No participó en el trabajo | Sesión separada, sin ver el razonamiento del constructor |
| Su única misión es encontrar fallos | Empieza suponiendo que hay al menos uno |
| Prohibido elogiar | No se aceptan «se ve bien» ni «está correcto» sin evidencia |
| Cada objeción es concreta | Qué está mal, en qué archivo o pantalla, cómo debería estar |
| Mira el resultado, no las intenciones | Capturas, respuestas HTTP reales, filas en la base, salida de comandos |
| Si no hay evidencia, no aprueba | «No lo pude comprobar» cuenta como no cumplido |

**Qué NO acepta como prueba:** que el código parezca correcto, que el build pase si además se exigía comportamiento, o una captura de una pantalla distinta a la que se pidió.

## 4. Rondas

- **Módulos con listón cerrado** (pantallas, formularios): **dos rondas** — construcción y corrección — y una verificación final.
- **Trabajos abiertos** (catálogo completo, seguridad): **hasta que el listón pase entero**, con un tope de 4 rondas. Si en la ronda 4 sigue habiendo fallos, se detiene y se reporta: significa que el diseño está mal, no que falte pulido.

Cada ronda se registra en [`rondas.md`](rondas.md). Sin registro, la ronda no existió.

## 5. Qué se gana y qué cuesta

Se gana: menos fallos que llegan al propietario, y un criterio escrito que no depende de quién esté delante.

Cuesta: más tiempo y más uso. La propia guía lo dice — es el precio de no revisar uno mismo. Por eso se aplica completo a lo que importa (datos, seguridad, módulos que el propietario va a usar) y de forma abreviada a lo trivial (un texto, un color).

## 6. Cuándo NO se usa

- Respuestas informativas que no producen cambios.
- Ajustes cosméticos de una línea.
- Cuando el propietario pide explícitamente una respuesta rápida y sin verificación.

En esos casos se dice igual: qué se hizo y qué no se comprobó.
