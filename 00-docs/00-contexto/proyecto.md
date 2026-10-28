# Contexto del proyecto — Catálogo digital de calzado

**Origen:** `Especificacion_Proyecto_Catalogo_Zapatos.pdf` — «Documento de traspaso para una IA o equipo de desarrollo», versión de traspaso inicial, 10 páginas.
**Este archivo:** resumen operativo para que cualquier agente entienda el proyecto sin releer el PDF. Ante duda, el PDF prevalece.

---

## Modelo comercial

Consulta de productos y solicitudes **por WhatsApp**. Sin pago en línea, sin checkout, sin pedidos automáticos. El administrador registra a mano las solicitudes que recibe y les da seguimiento.

**Criterio rector (§2):** la automatización prepara datos, pero no sustituye la confirmación del administrador cuando hay incertidumbre — inventario, precios, tallas, marcas y publicación.

## Alcance de la primera versión (§2)

**Incluido**
- Catálogo público responsive: inicio, marcas, productos, filtros, búsqueda, paginación, fichas.
- Ventana rápida + página independiente de detalle.
- Selección de talla y preparación del mensaje de WhatsApp.
- Panel privado: productos, marcas, fotos, precios, promociones, inventario.
- Estados de producto y revisión previa a la publicación.
- Registro manual de solicitudes de WhatsApp, con estados y seguimiento.
- Historial de cambios de inventario y de precios.
- Alertas en el panel y por correo.
- Importación CSV/Excel, exportación y copias de seguridad con restauración, **sujeto a validación técnica**.
- Diseño adaptable a móvil, tableta y escritorio.

**Excluido**
- Pago en línea o carrito con checkout.
- Creación automática de pedidos al abrir WhatsApp.
- Almacenamiento automático de conversaciones o solicitudes de WhatsApp.
- Registro público de usuarios o múltiples cuentas de administración.
- Páginas de Nosotros, Contacto, FAQ o políticas.
- Clasificación de fotografías totalmente autónoma sin revisión humana.

## Usuarios

- **Cliente público:** navega marcas y productos, filtra, elige talla disponible, revisa datos, abre WhatsApp con mensaje preparado. Si está agotado, puede verlo pero no iniciar solicitud.
- **Administrador (uno solo en la primera versión):** login con usuario/contraseña + verificación en dos pasos, dashboard, alta e importación de productos, corrección de sugerencias, selección de foto principal, validación de cantidades por talla, promociones, inventario, alertas, solicitudes e historial, exportación y copias.

## Estructura pública (§4)

Inicio (hero → marcas → ofertas de la semana → productos destacados) · Marcas en cuadrícula de logotipos · Catálogo de marca **sin pantalla intermedia de colecciones** · Tarjetas minimalistas, dos por fila en móvil · Búsqueda con sugerencias (marca, modelo, referencia, color) · Filtros (talla, precio, modelo) · Paginación · Ventana rápida · Ficha completa · Destacados y ofertas seleccionados manualmente por el administrador.

## Dirección visual (§5)

Boutique premium: limpia, cuidada, comercial, no genérica. Paleta de referencia marfil, tonos tierra, verde bosque y dorado discreto — **los valores exactos son una decisión pendiente**. Navidad sutil. Fotografía consistente, fondos neutros, sin alterar el color real del calzado. Mobile-first pero completo en tableta y escritorio. **Nombre de la tienda definido el 28/10/2026: «Dayara store»** (D-13). El logotipo sigue pendiente.

## Datos del producto (§6)

Campos confirmados: código interno · marca · modelo/referencia · color (sugerido por el sistema, confirmado por el administrador) · tallas y cantidades · precio normal · precio promocional (opcional) · fotografías (una principal obligatoria + adicionales con orden editable) · estado.

## Estados del producto (§6)

| Estado | Visibilidad |
|---|---|
| Pendiente de revisión | Privado; requiere validación del administrador |
| Borrador | En preparación; no aparece en el catálogo público |
| Publicado | Visible, con disponibilidad y precio vigentes |
| Agotado | Visible con etiqueta de agotado; no permite iniciar solicitud |
| Archivado | Oculto al público, conservado en el panel para consulta y recuperación |

## Inventario (§7)

Control por talla con cantidad exacta. Solo se muestran tallas con existencias. Si todas llegan a cero, el producto queda visible como agotado salvo que se archive. Actualización individual o en lote. Cada cambio guarda cantidad anterior, cantidad nueva, fecha y hora, motivo y responsable; el historial distingue entradas de mercancía, ventas y ajustes por error. Al confirmar una solicitud, el panel **pregunta** si descuenta unidades; si no alcanza, avisa y deja decidir. La web no descuenta al abrir WhatsApp.

## Solicitudes (§8)

Registro manual en el panel: producto, referencia, talla, precio, estado (pendiente / confirmada / cancelada), nombre del cliente, teléfono, fecha, observaciones y motivo de cancelación. Se conservan indefinidamente hasta que el administrador las elimine; acceso restringido al panel.

## Precios y promociones (§9)

Edición individual o en lote mostrando valores anteriores y nuevos antes de confirmar. Historial de precios con fecha. Promociones manuales sin fecha final o programadas con fecha de finalización; al vencer, el descuento deja de mostrarse y vuelve el precio normal **sin borrar el historial**.

## Entidades candidatas (§14)

Productos · Marcas · Imágenes de producto · Tallas/inventario · Historial de inventario · Historial de precios · Promociones · Destacados/ofertas · Solicitudes manuales · Notificaciones · Auditoría administrativa.

> La lista es una **guía de análisis, no un esquema definitivo**. El esquema se diseña y se documenta antes de programar.

## Seguridad (§15)

Mínimo privilegio. El público solo lee lo que debe ser público. RLS por tabla y políticas de Storage por bucket si se usa Supabase. Sin `service_role` en el frontend. Validación en cliente **y** en servidor. Protección de importaciones y exportaciones. Límite de intentos de login, cierre por inactividad, 2FA y recuperación de contraseña. Auditoría de acciones sensibles. Minimizar datos personales de las solicitudes y revisar requisitos legales de privacidad en Colombia antes de publicar.
