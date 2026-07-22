import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import {
  subirArchivo,
  TAREA_ARCHIVOS_PERMITIDOS,
  MAX_TAREA_ARCHIVO,
  tipoDeArchivo,
} from '@/lib/storage'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== UserRole.ESTUDIANTE) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id: tareaId } = await params

  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: { estudiante: true },
  })
  if (!user || !user.estudiante) {
    return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 })
  }

  const tarea = await db.tarea.findUnique({
    where: { id: tareaId },
    include: { curso: true },
  })
  if (!tarea) {
    return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })
  }

  // Verificar inscripción
  const inscrito = await db.inscripcion.findFirst({
    where: { estudianteId: user.estudiante.id, cursoId: tarea.cursoId },
  })
  if (!inscrito) {
    return NextResponse.json({ error: 'No inscrito en este curso' }, { status: 403 })
  }

  // Soporta multipart/form-data (con archivo) o JSON (legacy)
  const contentType = req.headers.get('content-type') || ''
  let comentario: string | undefined
  let archivoUrl: string | undefined
  let archivoNombre: string | undefined
  let archivoTipo: string | undefined
  let archivoFile: File | null = null
  let urlManual: string | undefined

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData()
    comentario = (formData.get('comentario') as string) || undefined
    urlManual = (formData.get('archivoUrl') as string)?.trim() || undefined
    archivoFile = formData.get('archivo') as File | null
  } else {
    const body = await req.json()
    comentario = body.comentario || undefined
    urlManual = body.archivoUrl?.trim() || undefined
  }

  // Subir archivo del estudiante si se proporcionó
  if (archivoFile && archivoFile.size > 0) {
    if (archivoFile.size > MAX_TAREA_ARCHIVO) {
      return NextResponse.json({
        error: `El archivo supera el tamaño máximo de ${(MAX_TAREA_ARCHIVO / (1024 * 1024)).toFixed(0)}MB permitido por el servidor.`,
      }, { status: 400 })
    }
    const r = await subirArchivo(archivoFile, 'tareas', TAREA_ARCHIVOS_PERMITIDOS, MAX_TAREA_ARCHIVO)
    if (!r.ok) {
      return NextResponse.json({ error: `No se pudo subir el archivo: ${r.error}` }, { status: 400 })
    }
    archivoUrl = r.url
    archivoNombre = archivoFile.name
    archivoTipo = tipoDeArchivo(archivoFile.type)
  } else if (urlManual) {
    // URL manual (legacy) — sin metadatos de tipo
    archivoUrl = urlManual
  }

  if (!comentario && !archivoUrl) {
    return NextResponse.json({
      error: 'Debe agregar un comentario o subir un archivo para entregar la tarea.',
    }, { status: 400 })
  }

  // Upsert entrega
  const entrega = await db.entrega.upsert({
    where: {
      tareaId_estudianteId: {
        tareaId,
        estudianteId: user.estudiante.id,
      },
    },
    update: {
      comentario,
      archivoUrl,
      archivoNombre,
      archivoTipo,
      fechaEntrega: new Date(),
    },
    create: {
      tareaId,
      estudianteId: user.estudiante.id,
      comentario,
      archivoUrl,
      archivoNombre,
      archivoTipo,
    },
  })

  return NextResponse.json({ ok: true, entrega })
}
