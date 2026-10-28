/**
 * Fotografías de producto: procesado en el navegador, subida y asignación.
 *
 * Por qué se procesa en el cliente: el plan gratuito de Supabase no incluye
 * transformación de imágenes y solo da 1 GB de almacenamiento. Una foto de móvil
 * sin tocar pesa 3-5 MB (~250 fotos); reducida a WebP de 1600 px pesa ~200 kB
 * (~5.000 fotos). Además se genera una miniatura de 480 px para las tarjetas,
 * que si no obligaría a descargar la foto grande en cada listado.
 *
 * Nada de esto decide: la foto entra en la bandeja y una persona la asigna.
 */

import { BUCKET_PRODUCTOS, CARPETA_FOTOS, urlPublica } from "./almacen";
import { supabase } from "./supabase";

const BUCKET = BUCKET_PRODUCTOS;
const CARPETA = CARPETA_FOTOS;

export const LADO_GRANDE = 1600;
export const LADO_MINI = 480;
export const CALIDAD = 0.82;
/** Por encima de esto el navegador sufre y el plan gratuito no lo necesita. */
const BYTES_MAXIMOS = 25 * 1024 * 1024;

function cliente() {
  if (!supabase) throw new Error("Supabase no está configurado.");
  return supabase;
}

export interface FotoProcesada {
  grande: Blob;
  mini: Blob;
  ancho: number;
  alto: number;
  sha256: string;
}

export interface ResultadoSubida {
  sha256: string;
  nueva: boolean;
  id: string;
}

export interface FotoBandeja {
  id: string;
  sha256: string;
  ruta: string;
  ruta_min: string | null;
  ancho: number | null;
  alto: number | null;
  bytes: number | null;
  creado_en: string;
}

export interface FotoProducto {
  id: string;
  ruta: string;
  ruta_min: string | null;
  principal: boolean;
  orden: number;
  sha256: string | null;
}

export { urlPublica };

async function aBlob(bitmap: ImageBitmap, lado: number, calidad: number): Promise<Blob> {
  const escala = Math.min(1, lado / Math.max(bitmap.width, bitmap.height));
  const ancho = Math.max(1, Math.round(bitmap.width * escala));
  const alto = Math.max(1, Math.round(bitmap.height * escala));

  const lienzo = document.createElement("canvas");
  lienzo.width = ancho;
  lienzo.height = alto;
  const contexto = lienzo.getContext("2d");
  if (!contexto) throw new Error("El navegador no permite procesar imágenes.");
  contexto.imageSmoothingQuality = "high";
  contexto.drawImage(bitmap, 0, 0, ancho, alto);

  const blob = await new Promise<Blob | null>((resolver) =>
    lienzo.toBlob(resolver, "image/webp", calidad),
  );
  if (!blob) throw new Error("El navegador no puede exportar WebP.");
  return blob;
}

async function huella(blob: Blob): Promise<string> {
  const datos = await blob.arrayBuffer();
  const digesto = await crypto.subtle.digest("SHA-256", datos);
  return [...new Uint8Array(digesto)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Reduce la foto, genera la miniatura y calcula su huella.
 *
 * `imageOrientation: "from-image"` aplica la rotación EXIF: sin eso, las fotos
 * hechas en vertical se suben tumbadas.
 */
export async function procesarArchivo(archivo: File): Promise<FotoProcesada> {
  if (!archivo.type.startsWith("image/")) {
    throw new Error(`${archivo.name}: no es una imagen.`);
  }
  if (archivo.size > BYTES_MAXIMOS) {
    throw new Error(`${archivo.name}: pesa ${(archivo.size / 1024 / 1024).toFixed(0)} MB, el máximo es 25 MB.`);
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(archivo, { imageOrientation: "from-image" });
  } catch {
    throw new Error(`${archivo.name}: el navegador no puede abrir este formato (HEIC, por ejemplo).`);
  }

  try {
    const grande = await aBlob(bitmap, LADO_GRANDE, CALIDAD);
    const mini = await aBlob(bitmap, LADO_MINI, CALIDAD);
    return {
      grande,
      mini,
      ancho: bitmap.width,
      alto: bitmap.height,
      sha256: await huella(grande),
    };
  } finally {
    bitmap.close();
  }
}

async function subirObjeto(ruta: string, blob: Blob): Promise<void> {
  const { error } = await cliente()
    .storage.from(BUCKET)
    .upload(ruta, blob, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
  if (!error) return;
  // Si ya existe, el archivo es el mismo (el nombre es la huella): no es un fallo.
  if (/already exists|Duplicate/i.test(error.message)) return;
  throw new Error(error.message);
}

/** Sube los dos tamaños y registra la foto en la bandeja. */
export async function subirFoto(archivo: File): Promise<ResultadoSubida> {
  const { grande, mini, ancho, alto, sha256 } = await procesarArchivo(archivo);
  const base = `${CARPETA}/${sha256.slice(0, 16)}`;
  const ruta = `${base}.webp`;
  const rutaMini = `${base}-min.webp`;

  await subirObjeto(ruta, grande);
  await subirObjeto(rutaMini, mini);

  const { data, error } = await cliente().rpc("registrar_foto", {
    p_sha256: sha256,
    p_ruta: ruta,
    p_ruta_min: rutaMini,
    p_ancho: ancho,
    p_alto: alto,
    p_bytes: grande.size,
  });
  if (error) throw new Error(error.message);

  const fila = (Array.isArray(data) ? data[0] : data) as { id: string; nueva: boolean };
  return { sha256, id: fila.id, nueva: fila.nueva };
}

export async function listarBandeja(): Promise<FotoBandeja[]> {
  const { data, error } = await cliente()
    .from("fotos_sin_asignar")
    .select("id, sha256, ruta, ruta_min, ancho, alto, bytes, creado_en")
    .order("creado_en", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as FotoBandeja[];
}

export async function asignarFoto(fotoId: string, productoId: string): Promise<string> {
  const { data, error } = await cliente().rpc("asignar_foto", {
    p_foto_id: fotoId,
    p_producto_id: productoId,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

async function borrarObjetos(rutas: (string | null | undefined)[]): Promise<void> {
  const limpias = rutas.filter((r): r is string => Boolean(r) && !/^https?:\/\//i.test(r as string));
  if (limpias.length === 0) return;
  // Si falla, queda un archivo huérfano en Storage: no rompe nada y se puede
  // limpiar a mano. Se registra en consola para no ocultarlo.
  const { error } = await cliente().storage.from(BUCKET).remove(limpias);
  if (error) console.warn("No se pudieron borrar fotos de Storage:", error.message);
}

export async function descartarFoto(foto: FotoBandeja): Promise<void> {
  const { data, error } = await cliente().rpc("descartar_foto", { p_foto_id: foto.id });
  if (error) throw new Error(error.message);
  const rutas = data as { ruta?: string; ruta_min?: string } | null;
  await borrarObjetos([rutas?.ruta, rutas?.ruta_min]);
}

export async function listarFotosProducto(productoId: string): Promise<FotoProducto[]> {
  const { data, error } = await cliente()
    .from("producto_imagenes")
    .select("id, ruta, ruta_min, principal, orden, sha256")
    .eq("producto_id", productoId)
    .order("orden", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as FotoProducto[];
}

export async function marcarPrincipal(imagenId: string): Promise<void> {
  const { error } = await cliente().rpc("marcar_principal", { p_imagen_id: imagenId });
  if (error) throw new Error(error.message);
}

export async function moverImagen(imagenId: string, direccion: -1 | 1): Promise<void> {
  const { error } = await cliente().rpc("mover_imagen", {
    p_imagen_id: imagenId,
    p_direccion: direccion,
  });
  if (error) throw new Error(error.message);
}

export async function quitarImagen(foto: FotoProducto): Promise<void> {
  const { data, error } = await cliente().rpc("eliminar_imagen", { p_imagen_id: foto.id });
  if (error) throw new Error(error.message);
  const rutas = data as { ruta?: string; ruta_min?: string } | null;
  await borrarObjetos([rutas?.ruta, rutas?.ruta_min]);
}
