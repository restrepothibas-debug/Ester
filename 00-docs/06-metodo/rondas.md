# Registro de rondas

Bitácora del método: qué se construyó, cuántas rondas hubo, qué rechazó el árbitro y qué se corrigió. Solo se añade; no se edita el pasado.

**Regla:** una ronda sin fila aquí no ocurrió. Y si no hubo árbitro, se dice.

---

## Intervenciones anteriores al método (28/10/2026)

| Intervención | Verificación que tuvo | Árbitro adversarial |
|---|---|---|
| Auditoría inicial del proyecto | Observación directa: API de GitHub, CLIs, workspace | No |
| Esquema y RLS en Supabase | Consultas a la base + 6 restricciones probadas con `rollback` + prueba anónima rechazada | No: lo verificó quien lo construyó |
| Catálogo público | Agente de navegador con encargo concreto (rutas, consola, 2 tamaños) | Parcial: actuó como inspector, no con encargo de buscar fallos |
| Panel: acceso | Agente de navegador: redirección, credenciales inválidas, persistencia, cierre | Parcial |
| Panel: marcas, productos, inventario | Agente de navegador con recorrido completo y datos temporales | Parcial |

**Conclusión honesta:** el trabajo anterior está probado con evidencia real, pero **no pasó por un árbitro con mandato adversarial**. A partir del 28/10, sí.

---

## Rondas con el método activo

| # | Fecha | Módulo | Rondas | Rechazado por el árbitro | Corregido | Resultado |
|---|---|---|---|---|---|---|
| R-001 | 28/10/2026 | Adopción del método y listón | 4 | R1: 3 fallos (B2 marcado ✔ sin prueba, AGENTS §4 desactualizado, enlace roto). R2: 3 fallos (enlace aún roto, estado-actual con filas obsoletas, AGENTS §8 «cerrado» vs «entregada»). R3: el subagente `verification` agotó su presupuesto de lectura y devolvió PARTIAL, sin veredicto. R4: auditor alternativo (`general`): 15 fallos, entre ellos citas a secciones inexistentes del PDF y el método sin versionar | Fase 3 y 4 marcadas como abiertas · estado-actual reescrito · citas §43–§67 corregidas a «punto N» · listón C sin casillas falsas · verificador ampliado a TODO y archivos no versionados · recuentos 14 tablas / 28 políticas | **PASS tras R4**, con la salvedad de que la última ronda la hizo un auditor alternativo |
