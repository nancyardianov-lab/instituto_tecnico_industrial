// Utilidad para almacenamiento de archivos:
// - En desarrollo local: guarda en /public/uploads (sistema de archivos)
// - En producción (Vercel): usa Vercel Blob
//
// Para usar Vercel Blob en producción, configurar:
//   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx
//
// Si no está configurado el token, intenta usar sistema de archivos local.
import { writeFile, mkdir, unlink } from 'fs/promises'
import path from 'path'
import { randomBytes } from 'crypto'

type UploadResult = { ok: true; url: string } | { ok: false; error: string }

const UPLOAD_ARCHIVOS_DIR = path.join(process.cwd(), 'public', 'uploads', 'biblioteca', 'archivos')
const UPLOAD_PORTADAS_DIR = path.join(process.cwd(), 'public', 'uploads', 'biblioteca', 'portadas')

// Detecta si estamos en producción con Vercel Blob configurado
function useVercelBlob(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN
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
 * @param tipo 'archivos' para libros/documentos, 'portadas' para imágenes
 * @param permitidos Mapa MIME -> extensión permitida
 * @param maxSize Tamaño máximo en bytes
 */
export async function subirArchivo(
  file: File,
  tipo: 'archivos' | 'portadas',
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

  // ====== Producción: Vercel Blob ======
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
  const destinoDir = tipo === 'portadas' ? UPLOAD_PORTADAS_DIR : UPLOAD_ARCHIVOS_DIR
  await mkdir(destinoDir, { recursive: true })
  const rutaCompleta = path.join(destinoDir, nombreSeguro)
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(rutaCompleta, buffer)
  const rutaPublica = `/uploads/biblioteca/${tipo}/${nombreSeguro}`
  return { ok: true, url: rutaPublica }
}

/**
 * Elimina un archivo del almacenamiento.
 * @param url URL o ruta del archivo a eliminar
 */
export async function eliminarArchivo(url?: string | null): Promise<void> {
  if (!url) return

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

export const MAX_ARCHIVO = 50 * 1024 * 1024 // 50 MB
export const MAX_PORTADA = 5 * 1024 * 1024  // 5 MB
