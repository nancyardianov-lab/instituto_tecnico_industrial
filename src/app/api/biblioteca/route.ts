import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { LibroCategoria, UserRole } from '@prisma/client'
import { randomBytes } from 'crypto'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const UPLOAD_ARCHIVOS = path.join(process.cwd(), 'public', 'uploads', 'biblioteca', 'archivos')
const UPLOAD_PORTADAS = path.join(process.cwd(), 'public', 'uploads', 'biblioteca', 'portadas')

// Extensiones y tipos MIME permitidos para archivos (libros / documentos)
const ARCHIVOS_PERMITIDOS: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.ms-powerpoint': 'ppt',
  'text/plain': 'txt',
  'application/epub+zip': 'epub',
  'application/octet-stream': 'bin', // se valida por extensión abajo
}

const PORTADAS_PERMITIDAS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

const MAX_ARCHIVO = 50 * 1024 * 1024 // 50 MB
const MAX_PORTADA = 5 * 1024 * 1024  // 5 MB

function sanitizeNombre(nombre: string): string {
  // Quita espacios y caracteres raros, deja el nombre seguro
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 80)
}

async function guardarArchivo(
  file: File,
  destinoDir: string,
  permitidos: Record<string, string>,
  maxSize: number,
): Promise<{ ok: true; rutaPublica: string } | { ok: false; error: string }> {
  if (!file) return { ok: false, error: 'No se recibió archivo' }
  if (file.size > maxSize) {
    return { ok: false, error: `El archivo "${file.name}" supera el tamaño máximo permitido` }
  }

  // Validar tipo MIME. Algunos navegadores mandan octet-stream para PDFs
  // descargados, así que también validamos por extensión.
  let ext = permitidos[file.type]
  if (!ext) {
    const extOriginal = file.name.split('.').pop()?.toLowerCase() || ''
    const extInversa = Object.values(permitidos).find((e) => e === extOriginal)
    if (extInversa) ext = extInversa
  }
  if (!ext) {
    return { ok: false, error: `Tipo de archivo no permitido: ${file.type || file.name}` }
  }

  await mkdir(destinoDir, { recursive: true })
  const prefijo = randomBytes(8).toString('hex')
  const nombreSeguro = `${prefijo}_${sanitizeNombre(file.name).replace(/\.[^.]+$/, '')}.${ext}`
  const rutaCompleta = path.join(destinoDir, nombreSeguro)
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(rutaCompleta, buffer)

  // Devolver ruta pública relativa
  const rutaPublica = `/uploads/biblioteca/${destinoDir.includes('portadas') ? 'portadas' : 'archivos'}/${nombreSeguro}`
  return { ok: true, rutaPublica }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')
  const categoria = searchParams.get('categoria')

  const where: any = { activo: true }
  if (categoria && categoria !== 'TODOS') {
    where.categoria = categoria as LibroCategoria
  }
  if (search) {
    where.OR = [
      { titulo: { contains: search } },
      { autor: { contains: search } },
      { descripcion: { contains: search } },
    ]
  }

  const libros = await db.libro.findMany({
    where,
    include: {
      _count: { select: { comentarios: true, favoritos: true } },
      comentarios: {
        where: { reportado: false, padreId: null },
        include: { user: { select: { name: true, foto: true } } },
        orderBy: { createdAt: 'desc' },
        take: 3,
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ libros })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || (session.role !== UserRole.ADMIN && session.role !== UserRole.DOCENTE)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const contentType = req.headers.get('content-type') || ''

    let titulo: string
    let autor: string
    let descripcion: string | undefined
    let categoria: string
    let paginasRaw: string | undefined
    let idioma: string
    let archivoUrl: string = '#'
    let portada: string | undefined
    let archivoFile: File | null = null
    let portadaFile: File | null = null

    if (contentType.includes('multipart/form-data')) {
      // ====== Subida con archivos reales ======
      const formData = await req.formData()
      titulo = (formData.get('titulo') as string)?.trim() || ''
      autor = (formData.get('autor') as string)?.trim() || ''
      descripcion = (formData.get('descripcion') as string) || undefined
      categoria = (formData.get('categoria') as string) || 'GENERAL'
      paginasRaw = (formData.get('paginas') as string) || undefined
      idioma = (formData.get('idioma') as string) || 'Español'
      archivoFile = formData.get('archivo') as File | null
      portadaFile = formData.get('portada') as File | null

      // URL manual opcional (si el usuario prefiere pegar un enlace en
      // vez de subir el archivo). Si sube archivo, esa URL se ignora.
      const urlManual = (formData.get('archivoUrl') as string)?.trim()
      const portadaUrlManual = (formData.get('portadaUrl') as string)?.trim()

      if (!archivoFile && urlManual) archivoUrl = urlManual
      if (!portadaFile && portadaUrlManual) portada = portadaUrlManual

      if (archivoFile && archivoFile.size > 0) {
        const r = await guardarArchivo(archivoFile, UPLOAD_ARCHIVOS, ARCHIVOS_PERMITIDOS, MAX_ARCHIVO)
        if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 })
        archivoUrl = r.rutaPublica
      }

      if (portadaFile && portadaFile.size > 0) {
        const r = await guardarArchivo(portadaFile, UPLOAD_PORTADAS, PORTADAS_PERMITIDAS, MAX_PORTADA)
        if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 })
        portada = r.rutaPublica
      }
    } else {
      // ====== JSON legacy (compatibilidad hacia atrás) ======
      const body = await req.json()
      titulo = body.titulo?.trim() || ''
      autor = body.autor?.trim() || ''
      descripcion = body.descripcion || undefined
      categoria = body.categoria || 'GENERAL'
      paginasRaw = body.paginas
      idioma = body.idioma || 'Español'
      archivoUrl = body.archivoUrl || '#'
      portada = body.portada
    }

    if (!titulo || !autor) {
      return NextResponse.json({ error: 'Título y autor son requeridos' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      include: { docente: true },
    })

    const libro = await db.libro.create({
      data: {
        titulo,
        autor,
        descripcion,
        categoria: (categoria || 'GENERAL') as LibroCategoria,
        archivoUrl,
        portada,
        paginas: paginasRaw ? parseInt(paginasRaw, 10) : null,
        idioma: idioma || 'Español',
        publicadoPor: session.userId,
        docenteId: user?.docente?.id,
      },
    })

    return NextResponse.json({ ok: true, libro })
  } catch (e: any) {
    console.error('[biblioteca POST] error:', e?.message || e)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
