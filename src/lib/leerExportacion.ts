/**
 * Lectura de una exportación de chat de WhatsApp (`chat.txt`).
 *
 * WhatsApp escribe dos formatos según el sistema:
 *   iOS:     [1/19/26, 11:03:24 PM] - Autor: texto
 *   Android: 19/1/26 23:03 - Autor: texto
 *
 * Aquí solo se separa el texto en mensajes. **No se interpreta la fecha**: el
 * mismo «1/19/26» es enero en un teléfono configurado en inglés y no existe en
 * uno configurado en español. Se conserva tal cual y se ordena por aparición.
 */

export interface MensajeExportado {
  /** Marca de tiempo tal como la escribió el teléfono, sin reinterpretar. */
  cuando: string;
  autor: string | null;
  texto: string;
  esSistema: boolean;
}

const IOS = /^\[([^\]]+)\]\s*-\s*(.*)$/;
const ANDROID = /^(\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[ap]\.?\s?m\.?)?)\s*-\s*(.*)$/i;

function pareceSistema(cuerpo: string): boolean {
  const t = cuerpo.trim();
  if (t.startsWith("[")) return true;               // [Notificación del sistema]
  if (/^(alguien|se|tu|usted)\b/i.test(t)) return true; // «Alguien añadió a Tú»
  if (!t.includes(": ")) return true;               // un aviso sin «Autor: texto»
  return false;
}

/**
 * Separa el contenido de `chat.txt` en mensajes. Las líneas que no empiezan por
 * una marca de tiempo se añaden al mensaje anterior (los mensajes de varias
 * líneas son lo normal en una publicación de mercancía).
 */
export function separarMensajes(contenido: string): MensajeExportado[] {
  const mensajes: MensajeExportado[] = [];
  let actual: MensajeExportado | null = null;

  for (const linea of contenido.split(/\r?\n/)) {
    if (!linea.trim()) continue;

    const m = linea.match(IOS) ?? linea.match(ANDROID);
    if (m) {
      const cuando = m[1].trim();
      const cuerpo = m[2];

      if (pareceSistema(cuerpo)) {
        mensajes.push({ cuando, autor: null, texto: cuerpo.replace(/^\[|\]$/g, "").trim(), esSistema: true });
        actual = null;
        continue;
      }

      const corte = cuerpo.indexOf(": ");
      const autor = corte > 0 && corte <= 40 ? cuerpo.slice(0, corte).trim() : null;
      const texto = autor ? cuerpo.slice(corte + 2).trim() : cuerpo.trim();

      actual = { cuando, autor, texto, esSistema: false };
      mensajes.push(actual);
      continue;
    }

    // Línea suelta: continuación del mensaje anterior, o ruido de cabecera.
    if (actual) actual.texto = `${actual.texto}\n${linea.trim()}`.trim();
  }

  return mensajes;
}

/** Mensajes que pueden ser una publicación de mercancía. */
export function publicaciones(mensajes: MensajeExportado[]): MensajeExportado[] {
  return mensajes.filter((m) => !m.esSistema && m.texto.trim().length >= 8);
}
