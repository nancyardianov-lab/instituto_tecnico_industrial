// Utilidad para almacenamiento de archivos:
// - En Netlify (producción): usa Netlify Blobs (almacenamiento persistente nativo)
// - En Vercel: usa Vercel Blob (si BLOB_READ_WRITE_TOKEN está configurado)
// - En desarrollo local: guarda en /public/uploads (sistema de archivos)
import { writeFile, mkdir, unlink } from 'fs/promises'
import path from 'path'
import { randomBytes } from 'crypto'

type UploadResult = { ok: true; url: string } | { ok: false; error: string }

const UPLOAD_ARCHIVOS_DIR = path.join(process.cwd(), 'public', 'uploads', 'biblioteca', 'archivos')
const UPLOAD_PORTADAS_DIR = path.join(process.cwd(), 'public', 'uploads', 'biblioteca', 'portadas')
const UPLOAD_TAREAS_DIR = path.join(process.cwd(), 'public', 'uploads', 'tareas')

// Detecta si estamos en Netlify con Blobs disponible
async function getNetlifyBlobStore(tipo: 'archivos' | 'portadas' | 'tareas') {
  try {
    const { getStore } = await import('@netlify/blobs')
    const store = getStore(`biblioteca-${tipo}`)
    return store
  } catch (e: any) {
    console.error('[storage] No se pudo obtener Netlify Blob store:', e?.message || e)
    return null
  }
}

function useVercelBlob(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN
}

// Detecta si estamos en entorno Netlify (producción)
function isNetlify(): boolean {
  return !!(process.env.NETLIFY || process.env.NETLIFY_LOCAL)
}

function sanitizeNombre(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 80)
}

function getExtension(file: File, permitidos: Record<string, string>): string | null {
  // Validar tipo MIME. Algunos navegadores mandan octet-stream.
  let ext = permitidos[file.type]
  if (!ext) {
    const extOriginal = file.name.split('.').pop()?.toLowerCase() || ''
    const extInversa = Object.values(permitidos).find((e) => e === extOriginal)
    if (extInversa) ext = extInversa
  }
  return ext || null
}

/**
 * Sube un archivo al almacenamiento configurado.
 * @param file Archivo a subir
 * @param tipo 'archivos' para libros/documentos, 'portadas' para imágenes, 'tareas' para adjuntos de tareas y entregas
 * @param permitidos Mapa MIME -> extensión permitida
 * @param maxSize Tamaño máximo en bytes
 */
export async function subirArchivo(
  file: File,
  tipo: 'archivos' | 'portadas' | 'tareas',
  permitidos: Record<string, string>,
  maxSize: number,
): Promise<UploadResult> {
  if (!file) return { ok: false, error: 'No se recibió archivo' }
  if (file.size > maxSize) {
    return { ok: false, error: `El archivo "${file.name}" supera el tamaño máximo permitido` }
  }
  const ext = getExtension(file, permitidos)
  if (!ext) {
    return { ok: false, error: `Tipo de archivo no permitido: ${file.type || file.name}` }
  }

  const prefijo = randomBytes(8).toString('hex')
  const baseName = sanitizeNombre(file.name).replace(/\.[^.]+$/, '')
  const nombreSeguro = `${prefijo}_${baseName}.${ext}`

  // ====== Netlify Blobs (producción en Netlify) ======
  if (isNetlify()) {
    const store = await getNetlifyBlobStore(tipo)
    if (store) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer())
        await store.set(nombreSeguro, buffer)
        // URL pública vía API route que sirve el blob
        const url = `/api/blob/${tipo}/${nombreSeguro}`
        return { ok: true, url }
      } catch (e: any) {
        console.error('[netlify-blob] error subiendo:', e?.message || e)
        return { ok: false, error: 'Error al subir archivo a Netlify Blobs: ' + (e?.message || 'desconocido') }
      }
    }
    // Si estamos en Netlify pero no hay store de Blobs disponible,
    // NO intentar escribir al sistema de archivos (es de solo lectura en producción).
    // Caer al fallback de Vercel Blob si está configurado, o dar error claro.
    if (!useVercelBlob()) {
      console.error('[storage] Netlify detectado pero Blobs no disponible. Configure Netlify Blobs en el dashboard.')
      return {
        ok: false,
        error: 'El almacenamiento de archivos no está configurado en el servidor (Netlify Blobs no disponible). Contacte al administrador.',
      }
    }
  }

  // ====== Vercel Blob ======
  if (useVercelBlob()) {
    try {
      const { put } = await import('@vercel/blob')
      const blob = await put(`biblioteca/${tipo}/${nombreSeguro}`, file, {
        access: 'public',
        addRandomSuffix: false,
      })
      return { ok: true, url: blob.url }
    } catch (e: any) {
      console.error('[blob] error subiendo:', e?.message || e)
      return { ok: false, error: 'Error al subir archivo a Blob: ' + (e?.message || 'desconocido') }
    }
  }

  // ====== Desarrollo: sistema de archivos local ======
  try {
    let destinoDir: string
    if (tipo === 'portadas') destinoDir = UPLOAD_PORTADAS_DIR
    else if (tipo === 'tareas') destinoDir = UPLOAD_TAREAS_DIR
    else destinoDir = UPLOAD_ARCHIVOS_DIR
    await mkdir(destinoDir, { recursive: true })
    const rutaCompleta = path.join(destinoDir, nombreSeguro)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(rutaCompleta, buffer)
    let rutaPublica: string
    if (tipo === 'portadas') rutaPublica = `/uploads/biblioteca/${tipo}/${nombreSeguro}`
    else if (tipo === 'tareas') rutaPublica = `/uploads/tareas/${nombreSeguro}`
    else rutaPublica = `/uploads/biblioteca/${tipo}/${nombreSeguro}`
    return { ok: true, url: rutaPublica }
  } catch (e: any) {
    console.error('[storage] error escribiendo archivo local:', e?.message || e)
    return { ok: false, error: 'No se pudo guardar el archivo en el servidor: ' + (e?.message || 'error desconocido') }
  }
}

/**
 * Elimina un archivo del almacenamiento.
 * @param url URL o ruta del archivo a eliminar
 */
export async function eliminarArchivo(url?: string | null): Promise<void> {
  if (!url) return

  // Netlify Blobs: las URLs empiezan con /api/blob/
  if (url.startsWith('/api/blob/')) {
    const partes = url.split('/')
    const tipo = partes[3] as 'archivos' | 'portadas' | 'tareas'
    const nombre = partes[4]
    if (tipo && nombre) {
      try {
        const store = await getNetlifyBlobStore(tipo)
        if (store) await store.delete(nombre)
      } catch (e) {
        console.error('[netlify-blob] error eliminando:', e)
      }
    }
    return
  }

  // Vercel Blob: las URLs empiezan con https://
  if (url.startsWith('https://') && useVercelBlob()) {
    try {
      const { del } = await import('@vercel/blob')
      await del(url)
    } catch (e) {
      console.error('[blob] error eliminando:', e)
    }
    return
  }

  // Local: las URLs empiezan con /uploads/
  if (url.startsWith('/uploads/')) {
    const ruta = path.join(process.cwd(), 'public', url)
    try { await unlink(ruta) } catch {}
  }
}

// Tablas de tipos permitidos (exportadas para reusar)
export const ARCHIVOS_PERMITIDOS: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.ms-powerpoint': 'ppt',
  'text/plain': 'txt',
  'application/epub+zip': 'epub',
  'application/octet-stream': 'bin',
}

export const PORTADAS_PERMITIDAS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

// Tipos permitidos para adjuntos de tareas (foto, video, documento)
export const TAREA_ARCHIVOS_PERMITIDOS: Record<string, string> = {
  // Imágenes
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  // Videos
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'video/x-msvideo': 'avi',
  // Documentos
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.ms-powerpoint': 'ppt',
  'text/plain': 'txt',
  // Fallback
  'application/octet-stream': 'bin',
}

// Determina la categoría del archivo según el MIME type
export function tipoDeArchivo(mime: string): 'imagen' | 'video' | 'documento' {
  if (mime.startsWith('image/')) return 'imagen'
  if (mime.startsWith('video/')) return 'video'
  return 'documento'
}

// IMPORTANTE: Netlify Functions tienen un límite duro de ~6 MB en el body
// de la petición. Si se sube un archivo más grande, la función falla con
// 500/413 antes de que nuestro código siquiera se ejecute. Por eso bajamos
// el límite a 5 MB (con margen para el resto del multipart).
// Para archivos más grandes, se debe usar subida directa a Netlify Blobs
// desde el cliente con URL firmada (no implementado todavía).
export const MAX_ARCHIVO = 5 * 1024 * 1024 // 5 MB (límite Netlify-safe)
export const MAX_PORTADA = 2 * 1024 * 1024 // 2 MB
export const MAX_TAREA_ARCHIVO = 5 * 1024 * 1024 // 5 MB (Netlify-safe)
