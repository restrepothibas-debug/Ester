# Fuentes autoalojadas

La aplicación **no** carga tipografías desde `fonts.googleapis.com` en tiempo de
ejecución. Los archivos se sirven desde este mismo origen, así que el catálogo
se ve igual aunque Google Fonts no esté disponible, haya un bloqueo de red o el
visitante esté en una conexión restringida.

| Archivo | Familia | Versión de Google Fonts | Subconjunto | Peso | Tamaño |
|---|---|---|---|---|---|
| `cormorant-garamond-v21-latin.woff2` | Cormorant Garamond | v21 | latin | 300–700 (variable) | 37,8 kB |
| `inter-v20-latin.woff2` | Inter | v20 | latin | 100–900 (variable) | 48,4 kB |

Los dos son fuentes variables: un archivo por familia cubre todos los pesos que
usa el sistema visual, así que no hay que descargar una instancia por grosor.

## Por qué solo «latin»

El sitio está en español y el subconjunto `latin` incluye los acentos, la eñe y
los signos de apertura (`á é í ó ú ñ ü ¿ ¡`), además del guion largo y el signo
de pesos. No se descargan cirílico, griego ni vietnamita: son ~150 kB que ningún
visitante de este catálogo necesita.

## Licencia

Ambas familias se distribuyen bajo **SIL Open Font License 1.1**. Las licencias
completas están en este mismo directorio (`OFL-CormorantGaramond.txt`,
`OFL-Inter.txt`) y deben viajar con los archivos si se copian a otro sitio.

## Cómo actualizar

1. Pedir la hoja de estilos con un navegador moderno, para recibir `woff2`:
   ```bash
   curl -sS -A "Mozilla/5.0 … Chrome/131.0.0.0 Safari/537.36" \
     "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=Inter:wght@400;500&display=swap"
   ```
2. Copiar la URL del bloque `/* latin */` de cada familia.
3. Descargarla aquí con un nombre que incluya la versión (`…-v22-latin.woff2`).
4. Actualizar `src/styles/fuentes.css` con el nombre nuevo.

El nombre lleva la versión a propósito: `vercel.json` marca `/fuentes/*` como
inmutable durante un año, así que **cambiar el contenido sin cambiar el nombre
dejaría a los visitantes con la versión vieja en caché**.
