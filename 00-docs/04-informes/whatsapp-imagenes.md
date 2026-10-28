# Ingesta de fotografías desde WhatsApp — opciones, costos y veredicto

**Fecha:** 28/10/2026 · **Estado:** informe para decisión del propietario (D-28)
**Pregunta:** ¿cuál es la mejor forma de conectar con WhatsApp, descargar las imágenes, analizarlas y montarlas, sin pagar nada?

Todas las cifras y reglas de este informe salen de documentación oficial consultada hoy. Donde no hay fuente oficial, se dice.

---

## 1. Veredicto en una línea

**Hoy, la única ruta que es gratuita, cumple los términos de WhatsApp y no pone en riesgo el número del negocio es la exportación manual del chat con multimedia (`.zip`) y su procesamiento local.** La API oficial también es gratis *para recibir*, pero exige montar una app de Meta y, para usar el número actual del negocio, pasar por un proveedor homologado; además **no ve los chats de grupo**. La automatización no oficial queda descartada por contrato, no por preferencia.

---

## 2. Qué necesita realmente el proyecto

| Requisito | Valor |
|---|---|
| Volumen | Decenas de fotos por lote, no miles por hora |
| Frecuencia | Por tandas: llega mercancía nueva → se fotografían o llegan del proveedor → se publican |
| Presupuesto | **Cero** |
| Tolerancia a riesgo | **Nula** sobre el número de WhatsApp: es el canal por el que se cierran las ventas |
| Quién opera | El propietario, desde el móvil, sin conocimientos técnicos |
| Destino | Supabase Storage, servido al catálogo |

Con ese perfil, la pregunta correcta no es «qué API existe» sino «qué proceso aguanta el uso real sin depender de nadie».

---

## 3. Las cuatro rutas

| | A. Exportación manual | B. Cloud API con número nuevo | C. Coexistencia (número actual) | D. Automatización no oficial |
|---|---|---|---|---|
| Coste | **0** | 0 al recibir; se paga solo lo que se envía | 0 al recibir; el envío por API se factura | 0 en dinero |
| ¿Cumple los términos? | **Sí** | Sí | Sí | **No** |
| Riesgo para el número | Ninguno | Ninguno | Ninguno | **Bloqueo permanente** |
| Ve chats de grupo | **Sí** | No | **No** (los grupos no se sincronizan) | Sí |
| Automático | No | Sí | Sí | Sí |
| Esfuerzo de puesta en marcha | 5 minutos | Alto (app, cuenta, webhook, token permanente) | Alto **y** requiere proveedor homologado | Medio |
| Depende de terceros | No | Meta | Meta + proveedor | Librería sin soporte |

---

## 4. Detalle con la evidencia

### A. Exportación manual del chat con multimedia

El propio WhatsApp exporta un chat completo a un `.zip` que contiene un archivo de texto con las conversaciones y **todas las fotos y vídeos** del hilo. En Android: menú del chat → *Más* → *Exportar chat* → *Incluir archivos*. En iPhone: nombre del contacto → *Exportar chat* → *Con todos los archivos*.

- **Coste real: cero.** No hay API, no hay cuenta de Meta, no hay servidor.
- **Cumple los términos** porque es una función del propio cliente, no una automatización.
- **Incluye los grupos**, que es donde suelen estar las fotos de proveedores y de las tandas de mercancía.
- **Cada foto conserva su nombre original** (`IMG-20261028-WA0012.jpg`), del que se puede sacar la fecha.
- **Límite importante:** las fotos enviadas «como foto» llegan **reescaladas y recomprimidas** por WhatsApp. Para conservar el original hay que pedirlas **como documento** (clip → Documento). Esto no lo arregla ninguna API: es cómo funciona el cliente.

### B. Cloud API con un número nuevo

Meta no cobra por **recibir**: «Meta does not charge for messages from users to businesses». Tampoco por descargar multimedia. Lo que se cobra es el mensaje que **el negocio envía**, y desde el 1 de octubre de 2026 los mensajes de servicio también se facturan, con **1.000 mensajes de servicio gratis al mes por número**.

Si solo se reciben fotos, el coste es **0**. Pero:

- Hace falta una app de Meta, una cuenta de WhatsApp Business (WABA), un número dedicado y un **webhook** público (Supabase Edge Functions sirve: 500.000 invocaciones gratis al mes).
- El número dedicado **no puede ser el del negocio** si ese número ya está en la app de WhatsApp: o se migra (y se deja de usar la app), o se usa otro número.
- Los `media id` de un webhook **caducan a los 7 días** y la URL de descarga **a los 5 minutos**: hay que descargar en el momento, no «cuando se pueda».
- Solo acepta **JPEG y PNG de hasta 5 MB**.
- **No ve grupos.** La API solo recibe lo que llega al número por conversación individual.

### C. Coexistencia: el número actual en la app **y** en la API

Es una función oficial: el número sigue en la app de WhatsApp Business y a la vez se conecta a Cloud API, con el historial sincronizado y los mensajes reflejados en ambos lados. La documentación oficial lo llama «onboarding de usuarios de la app de WhatsApp Business» y avisa de que en canales de soporte se le dice *coexistence*.

Tres condiciones que la hacen poco práctica para este proyecto:

1. **No es autoservicio.** Los requisitos oficiales son: «You must already be a Solution Partner or Tech Provider» y se activa por *Embedded Signup*, un flujo pensado para proveedores. Un negocio suelto no entra por ahí sin pasar por un tercero.
2. **Los grupos no se sincronizan**: «Group chats — Not supported. Group chats will not be synchronized.» Si las fotos llegan por un grupo de proveedores, la API no las ve.
3. El rendimiento queda limitado a 20 mensajes por segundo y se desactivan listas de difusión y mensajes efímeros.

### D. Automatización no oficial (Baileys, whatsapp-web.js y similares)

Es la opción que aparece primero al buscar «gratis», y es la que hay que descartar:

> «All WhatsApp Business Platform use must comply with our terms and policies. **Using unauthorized third-party tools is prohibited.**»
> — *About the WhatsApp Business Platform*, Meta, actualizado el 4/8/2026.

El coste no es una cuota, es el número: un bloqueo permanente deja al negocio sin su canal de ventas. No se implementa.

### E. Límites del plan gratuito de Supabase (destino final)

| Límite | Free |
|---|---|
| Almacenamiento | 1 GB |
| Subida máxima por archivo | 50 MB |
| Egress en caché | 5 GB/mes |
| Transformación de imágenes | **No incluida** |

1 GB da para **3.000–5.000 fotos** ya optimizadas (200–300 kB cada una). Como las transformaciones de imagen no están incluidas, **la optimización tiene que hacerse antes de subir**, en local. Eso refuerza la ruta A: el procesamiento ocurre en el equipo del propietario, no en un servicio.

---

## 5. Recomendación

**Ruta A ahora; ruta C solo si algún día el volumen lo justifica; ruta D nunca.**

1. **El propietario exporta** el chat donde estén las fotos, con multimedia, y deja el `.zip` en una carpeta del proyecto (`entrada/`, fuera de git).
2. **Un procesador local** hace el trabajo pesado, sin red y sin coste:
   - descomprime y separa fotos de vídeos y audios;
   - calcula el **SHA-256** de cada archivo para descartar duplicados (el mismo producto suele llegar repetido en varios chats);
   - lee dimensiones, orientación y fecha; corrige la rotación por EXIF;
   - redimensiona a **1600 px de lado mayor**, exporta **WebP** (calidad 82) y genera una miniatura de 480 px. **No recorta**: el encuadre de la tarjeta lo resuelve el CSS, y recortar en el procesador destruiría píxeles que quizá hagan falta en la ficha;
   - detecta fotos inservibles (borrosas por tamaño, capturas de pantalla, menos de 800 px);
   - guarda un **índice SQLite** con ruta, hash, dimensiones, fecha, chat de origen y estado (`pendiente`, `asignada`, `descartada`, `publicada`).
3. **Revisión humana:** se ve la tanda, se asigna cada foto a un producto por su código y se elige la principal. Nada se publica solo: el PDF prohíbe publicar con datos dudosos (§19.6).
4. **Subida** a Supabase Storage con nombre estable (`<codigo>/<n>.webp`), y el catálogo lee de ahí.

Por qué SQLite y no otra cosa: el índice tiene que sobrevivir entre tandas, permitir reprocesar sin duplicar y consultarse sin red. Un archivo `.sqlite` en el equipo lo hace con la biblioteca estándar de Python (`sqlite3`), sin instalar nada y sin coste. **Para las fuentes no aplica**: el navegador no ejecuta SQLite y una tipografía no es un dato de aplicación; ahí el equivalente correcto es el archivo servido desde el propio dominio (D-45).

---

## 6. El procesador ya existe y está probado

`scripts/procesar-fotos.py` implementa la ruta A. Se probó con una exportación sintética que imita la real (carpeta con nombre de chat, `_chat.txt`, nombres `IMG-AAAA...-WA####`, un duplicado exacto, una captura de pantalla, una imagen diminuta y un vídeo): **30 comprobaciones en verde** con `scripts/probar-procesar-fotos.py`.

```bash
# procesar una exportación
python3 scripts/procesar-fotos.py --entrada fotos/entrada/"WhatsApp Chat con Proveedores.zip"

# ver el estado del índice sin procesar nada
python3 scripts/procesar-fotos.py --resumen

# repetir la prueba del módulo
python3 scripts/probar-procesar-fotos.py
```

Deja `fotos/grandes/<hash>.webp`, `fotos/miniaturas/<hash>.webp` y `fotos/indice.sqlite`. Todo eso está fuera de git. Nada se publica: cada foto entra como `pendiente`, `revisar` (captura o poca nitidez) o `descartada` (resolución insuficiente), y la asignación al producto es manual.

**Decisión tomada:** el número del negocio está en la **app de WhatsApp Business**, así que la coexistencia es teóricamente posible en el futuro, pero sigue exigiendo un proveedor homologado y no vería los grupos. La ruta manual es la que se implementa.

---

## Fuentes

- Meta — *Pricing on the WhatsApp Business Platform* (actualizado 30/9/2026): cobro por mensaje, 1.000 mensajes de servicio gratis al mes, recepción siempre gratis, ventana de 24 h. https://developers.facebook.com/docs/whatsapp/pricing
- Meta — *Media* (actualizado 16/6/2026): `media id` 7 días, URL 5 minutos, JPEG/PNG hasta 5 MB, descarga con token. https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media
- Meta — *About the WhatsApp Business Platform* (actualizado 4/8/2026): prohibición de herramientas de terceros no autorizadas. https://developers.facebook.com/docs/whatsapp/cloud-api/overview
- Meta — *Onboard WhatsApp Business app users* (coexistencia): requisito de ser Solution Partner o Tech Provider, grupos no sincronizados, 20 mps. https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/onboarding-business-app-users
- WhatsApp — *Cómo exportar tu historial de chats*: «Incluir archivos» / «Con todos los archivos». https://faq.whatsapp.com/1180414079177245/
- Supabase — *Pricing*: Free 1 GB de almacenamiento, 50 MB por archivo, sin transformación de imágenes. https://supabase.com/pricing
