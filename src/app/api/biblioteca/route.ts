import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { LibroCategoria, UserRole } from '@prisma/client'
import {
  subirArchivo,
  ARCHIVOS_PERMITIDOS,
  PORTADAS_PERMITIDAS,
  MAX_ARCHIVO,
  MAX_PORTADA,
} from '@/lib/storage'

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
        const r = await subirArchivo(archivoFile, 'archivos', ARCHIVOS_PERMITIDOS, MAX_ARCHIVO)
        if (!r.ok) {
          console.error('[biblioteca POST] error subiendo archivo:', r.error)
          return NextResponse.json({ error: `No se pudo subir el archivo: ${r.error}` }, { status: 400 })
        }
        archivoUrl = r.url
      }

      if (portadaFile && portadaFile.size > 0) {
        const r = await subirArchivo(portadaFile, 'portadas', PORTADAS_PERMITIDAS, MAX_PORTADA)
        if (!r.ok) {
          console.error('[biblioteca POST] error subiendo portada:', r.error)
          return NextResponse.json({ error: `No se pudo subir la portada: ${r.error}` }, { status: 400 })
        }
        portada = r.url
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
