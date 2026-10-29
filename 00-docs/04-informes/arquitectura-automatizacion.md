# Qué buscamos: el catálogo que se llena solo

**28/10/2026** · Documento de alineación. Si algo de aquí no es lo que se busca, hay que corregirlo antes de escribir más código.

---

## 1. La meta, en una frase

**Que el catálogo se llene solo.** El proveedor publica su mercancía —una foto y un texto con modelo, precio y tallas—, y esa publicación se convierte en un producto listo, con su marca, su precio y sus tallas. La persona no copia, no descarga, no teclea: **revisa y aprueba**.

Lo que buscamos no es «un formulario más cómodo». Es que el trabajo de crear el producto desaparezca.

---

## 2. El principio que ordena todo

**La máquina propone, la persona dispone.** Nada se publica solo. Pero «revisar» no es «hacer»: si hay que escribir el precio a mano en cada producto, no hemos automatizado nada.

De ahí la única regla que no se negocia en el código: **cuando un dato no está escrito, queda vacío y marcado, no se adivina**. Un precio inventado se convierte en un problema con el cliente; un catálogo que miente una vez deja de usarse.

---

## 3. El embudo, pieza por pieza

| # | Pieza | Qué hace | Estado |
|---|---|---|---|
| 1 | **Entrada** | Recibe el mensaje de WhatsApp (foto + texto) y lo deja en la bandeja | 🟨 Tabla y funciones hechas; **falta el endpoint público** |
| 2 | **Imagen** | Descarga, deduplica por huella, reduce a WebP 1600 + miniatura, sube a Storage | ✅ Hecho |
| 3 | **Lectura del texto** | Saca modelo, marca, código, precio, tallas y colores; dice qué falta | ✅ Hecho y probado (30 comprobaciones) |
| 4 | **Creación** | Crea el producto en `pendiente_revision` con su marca, precio e imagen | 🟨 Falta el paso que une 2+3 |
| 5 | **Revisión** | Pantalla con lo que la máquina entendió, campos vacíos marcados y un botón «aprobar» | 🟨 Pendiente |
| 6 | **Publicación** | El producto sale al catálogo con su precio vigente y su stock | ✅ Hecho (módulos anteriores) |

Las piezas 2, 3 y 6 ya existen y están probadas. **El trabajo que queda es 1, 4 y 5.**

---

## 4. La única decisión que falta: por dónde entra

El catálogo puede llenarse solo en cuanto el mensaje llegue a un sitio que podamos leer. Hay tres puertas y ninguna otra:

| Puerta | Automatización | Qué exige |
|---|---|---|
| **Grupo propio** (Groups API, ≤8 personas) | Total | Official Business Account + número en Cloud API + que los proveedores publiquen ahí |
| **Mensaje directo** al número del negocio | Total | Número en Cloud API + que los proveedores escriban ahí |
| **Exportación del chat** | Total menos exportar | Nada. Funciona hoy |

Una comunidad no es una puerta: no existe API para leerla (D-49). Eso no está en discusión ni depende de presupuesto.

**La decisión no es técnica, es de negocio:** por dónde queremos que nos manden la mercancía. El software es el mismo en las tres.

---

## 5. Qué falta de tu lado

Para activar la puerta automática (grupo o mensaje directo):

1. **Un número en la Cloud API.** El de la tienda está en la app; puede pasar con coexistencia, pero eso lo habilita un proveedor homologado.
2. **Un sitio donde publicar el endpoint** que recibe los mensajes (Supabase Edge Functions o Vercel). Necesita el token de la cuenta.
3. **La verificación del negocio** y el *Official Business Account* si vamos por el grupo (30 días).

Sin eso, el resto del sistema se puede terminar y probar: la bandeja acepta mensajes con la misma forma que envía Meta, así que se puede validar el circuito completo antes de conectar el número.

---

## 6. Cómo sabremos que funciona

- Llega una publicación con «Botín Aurora $159.000 tallas 36,37,38» y en el panel aparece un producto en borrador con esos tres datos, la marca ya asociada y la foto.
- Un texto que no trae precio aparece **sin precio**, marcado, y no con un cero ni con una cifra deducida.
- La misma foto dos veces no crea dos productos.
- Nada se publica sin que alguien pulse «aprobar».
