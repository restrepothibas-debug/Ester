# Automatizar la comunidad de WhatsApp: qué se puede y qué no

**Fecha:** 28/10/2026 · **Estado:** análisis para decisión del propietario
**Petición:** un agente que revise la comunidad, descargue las imágenes, coja las descripciones que publican allí y las suba a la plataforma como productos. Intervención humana solo para verificar y confirmar.

Todo lo que sigue está comprobado en documentación oficial de Meta consultada hoy (28/10/2026), no deducido por lógica. Donde no hay fuente, se dice.

---

## 1. Veredicto

**Leer una comunidad de WhatsApp de forma automática no se puede.** No existe API de Comunidades en la plataforma de WhatsApp Business, y la única API de grupos que existe —Groups API— solo cubre grupos que **el propio negocio crea**, con un máximo de **8 participantes**. No hay forma oficial de que un negocio se una a una comunidad ajena y reciba lo que se publica en ella.

**Lo demás sí se puede automatizar entero**, y es la mayor parte del trabajo: descargar la imagen, leer la descripción, sacar modelo, precio y tallas, comprobar duplicados, crear el producto en borrador y dejarlo listo para que alguien confirme.

El cuello de botella no es el agente. Es **por dónde entra el contenido**. Eso es lo que hay que decidir.

---

## 2. Los hechos, con su fuente

| # | Hecho | Fuente oficial (28/10/2026) |
|---|---|---|
| 1 | La Cloud API recibe mensajes dirigidos **al número del negocio**, uno a uno. No hay recepción de comunidades. | Plataforma de mensajería de WhatsApp |
| 2 | Existe una **Groups API** abierta a negocios con *Official Business Account*. Sirve para **crear** grupos: el negocio queda como creador y administrador, los demás entran por enlace de invitación. | `whatsapp/groups` |
| 3 | **Máximo 8 participantes** por grupo. | `whatsapp/groups` — «Max group participants: 8» |
| 4 | La Groups API **no está disponible** para números de la app WhatsApp Business ni para *Multi-solution Conversations*. | `whatsapp/groups` — Limits |
| 5 | Se pueden recibir mensajes de grupo por webhook (llegan con `group_id`), incluidos texto y multimedia. | `whatsapp/groups/groups-messaging` |
| 6 | Recibir es gratis. Se cobra por mensaje **entregado** que envía el negocio, con la tarifa de 1 a 1, y 1.000 mensajes gratis al mes **compartidos** con los de servicio. | `whatsapp/groups/pricing` |
| 7 | La coexistencia (app + API en el mismo número) **no sincroniza grupos**. | `whatsapp/embedded-signup/onboarding-business-app-users` |
| 8 | El *Official Business Account* exige: 30 días en la plataforma, verificación del negocio, doble paso activado y nombre visible aprobado. No se concede a números de la app. Si lo deniegan, 30 días de espera. | `whatsapp/official-business-accounts` |
| 9 | El uso de herramientas no autorizadas está prohibido por los términos. | Plataforma de mensajería de WhatsApp |

**Lo que no encontré:** ninguna página oficial que mencione Comunidades dentro de la plataforma de WhatsApp Business. Los artículos que anuncian «añadir gente a comunidades por API» son de proveedores que venden servicios, no de Meta. No los tomo como prueba.

---

## 3. Qué significa cada bloqueo, en la práctica

**Bloqueo 1 · No hay API de comunidades.** El agente no puede «entrar» a una comunidad. Ni leyendo, ni escuchando. No es una limitación de permisos que se resuelva pidiendo acceso: el recurso no está expuesto.

**Bloqueo 2 · Los grupos de la API son tuyos, no de otros.** La Groups API crea grupos con enlace de invitación, no une al negocio a un grupo existente. Además, 8 personas como máximo: una comunidad de proveedores con 200 miembros no cabe ni de lejos.

**Bloqueo 3 · El número.** Hoy el negocio está en la **app de WhatsApp Business**. Ese número no puede estar a la vez en la Cloud API sin pasar por una coexistencia que solo se activa a través de un proveedor homologado. Y aunque se activara, los grupos no se sincronizan.

**Bloqueo 4 · La vía no oficial.** Automatizar WhatsApp Web o usar librerías no oficiales funciona técnicamente, pero va contra los términos y el precio no es una cuota: es el número por el que se cierran las ventas. Descartado por indicación expresa.

---

## 4. Las tres arquitecturas que quedan

### A · Grupo propio, creado por el negocio (Groups API)

El negocio crea un grupo con la API, invita a dos o tres proveedores, y ellos publican allí las fotos con su descripción. Cada publicación llega por webhook, con su texto y su imagen, y el resto es automático.

- **Automatización de la captura:** total.
- **Coste:** cero al recibir. Los mensajes que envíe el negocio, a tarifa normal, dentro de 1.000 gratis al mes.
- **Requisitos:** *Official Business Account* (30 días + verificación + doble paso + nombre aprobado), número en Cloud API.
- **Límites duros:** 8 participantes. **Cambia el hábito de los proveedores**: tienen que publicar en tu grupo y no en la comunidad.
- **Riesgo:** nulo, es el camino oficial.

### B · Mensajes uno a uno al número del negocio (Cloud API)

El proveedor escribe directamente al número. Se recibe el texto y la imagen, y el resto es automático. Mismo proceso que A, sin grupo.

- **Automatización:** total.
- **Coste:** cero al recibir.
- **Requisito:** el número tiene que estar en la Cloud API (hoy está en la app).
- **Límite:** solo vale si el proveedor escribe al negocio, no si publica en una comunidad.

### C · Exportación manual del chat (lo que ya está construido)

Alguien exporta el chat o la comunidad con multimedia, suelta el `.zip`, y a partir de ahí todo es automático: descompresión, deduplicado, clasificación, extracción de datos y creación del borrador.

- **Automatización:** total salvo el primer gesto (exportar).
- **Coste:** cero. **Riesgo:** cero. **Funciona hoy, con la comunidad que ya existe.**
- **Límite:** no es «sin tocar nada». Es un gesto por tanda.

---

## 5. Lo que de verdad se automatiza (y lo que no)

Con cualquiera de las tres rutas, esto queda automático:

1. Llegada del contenido (webhook en A y B; `.zip` en C).
2. Descarga de la imagen original.
3. Duplicado por huella: si ya entró, no se repite.
4. Reducción a WebP y miniatura, subida a Storage.
5. Lectura del texto: modelo, marca, precio, tallas, colores.
6. Búsqueda o creación de la marca; creación del producto en **`pendiente_revision`**.
7. Aviso en el panel: «3 productos nuevos por revisar».

Y esto **no** se automatiza, ni con A ni con B ni con C:

- **Publicar.** Un producto no sale al catálogo sin que alguien lo apruebe. Es el estado `pendiente_revision` que ya existe.
- **Interpretar un texto ambiguo con certeza.** «Docena a 150», «36-40», «queda 1» no son un formato. Se puede extraer mucho, pero cuando hay duda el campo se deja vacío y se marca para revisión. Rellenar por deducción sería inventar precios y tallas, y eso en un catálogo que cierra ventas por WhatsApp se paga caro.
- **Ver la comunidad.** En ninguna de las tres.

---

## 6. Qué hace falta decidir, y qué no puedo suponer

No voy a asumir nada de esto; necesito que me lo digan:

1. **¿La comunidad es tuya o de un proveedor?** Si es tuya, quizá puedas pedir que además publiquen en un grupo pequeño. Si es de un tercero, no puedes cambiar sus hábitos y la ruta A se cae.
2. **¿Cómo llegan hoy las fotos?** ¿Solo por la comunidad, o algunos proveedores ya te escriben uno a uno?
3. **¿Cómo son las descripciones?** Con tres o cinco publicaciones reales (captura de pantalla) sé si el texto se puede interpretar o si hará falta que alguien escriba el modelo y el precio a mano.
4. **¿Cuánto volumen hay?** Cinco publicaciones por semana se llevan a mano sin problema; cincuenta al día necesitan automatización sí o sí.
5. **¿Hay un número disponible para la API?** El de la tienda está en la app. Pasar ese número a la API lo saca de la app salvo coexistencia por proveedor, y eso hay que decidirlo con la pérdida de historial en la mano.

Y lo que **no** voy a suponer mientras no haya respuesta: que los proveedores cambiarán su forma de publicar, que el precio se puede leer con fiabilidad de un texto libre, que existe una exportación de comunidad por chat, o que el número se puede mover sin consecuencias.

---

## 7. Recomendación

**Empezar por C, que ya funciona, y medir.** La exportación manual no exige cambiar nada de nadie y hoy mismo se puede probar con contenido real: si en la primera tanda el texto se interpreta bien, el resto del proceso ya está construido y solo falta decidir el canal. Si el texto resulta imposible de interpretar sin una persona, invertir en la API no lo arreglaría: el problema estaría en el formato del proveedor, no en la tubería.

**A o B después, solo si el volumen lo justifica y hay acuerdo con los proveedores.** La API no da acceso a la comunidad; da acceso a conversaciones dirigidas al negocio. Eso puede ser mejor que la comunidad —un mensaje directo con la foto y el precio es más limpio que un muro de publicaciones— pero es un cambio de hábito que decide el proveedor, no el software.
