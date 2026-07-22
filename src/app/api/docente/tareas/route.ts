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

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== UserRole.DOCENTE) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: { docente: true },
  })
  if (!user || !user.docente) {
    return NextResponse.json({ error: 'Docente no encontrado' }, { status: 404 })
  }

  const tareas = await db.tarea.findMany({
    where: { docenteId: user.docente.id },
    include: {
      curso: { select: { nombre: true, carrera: { select: { nombre: true } } } },
      _count: { select: { entregas: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ tareas })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== UserRole.DOCENTE) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: { docente: true },
  })
  if (!user || !user.docente) {
    return NextResponse.json({ error: 'Docente no encontrado' }, { status: 404 })
  }

  // Soporta tanto multipart/form-data (con archivo) como JSON (legacy)
  const contentType = req.headers.get('content-type') || ''
  let titulo: string
  let descripcion: string
  let cursoId: string
  let fechaEntrega: string
  let punteoMaximo: string
  let archivoFile: File | null = null

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData()
    titulo = (formData.get('titulo') as string)?.trim() || ''
    descripcion = (formData.get('descripcion') as string) || ''
    cursoId = (formData.get('cursoId') as string) || ''
    fechaEntrega = (formData.get('fechaEntrega') as string) || ''
    punteoMaximo = (formData.get('punteoMaximo') as string) || '100'
    archivoFile = formData.get('archivo') as File | null
  } else {
    const body = await req.json()
    titulo = body.titulo?.trim() || ''
    descripcion = body.descripcion || ''
    cursoId = body.cursoId || ''
    fechaEntrega = body.fechaEntrega || ''
    punteoMaximo = body.punteoMaximo || '100'
  }

  if (!titulo || !cursoId || !fechaEntrega) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  // Verificar que el curso pertenece al docente
  const asignado = await db.cursoAsignado.findFirst({
    where: { cursoId, docenteId: user.docente.id },
  })
  if (!asignado) {
    return NextResponse.json({ error: 'No tiene permiso sobre este curso' }, { status: 403 })
  }

  // Subir archivo de apoyo si se proporcionó
  let archivoUrl: string | undefined
  let archivoNombre: string | undefined
  let archivoTipo: string | undefined

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
  }

  const tarea = await db.tarea.create({
    data: {
      titulo,
      descripcion,
      cursoId,
      docenteId: user.docente.id,
      fechaEntrega: new Date(fechaEntrega),
      punteoMaximo: parseFloat(punteoMaximo) || 100,
      archivoUrl,
      archivoNombre,
      archivoTipo,
    },
  })

  // Crear notificaciones a los estudiantes inscritos
  const inscripciones = await db.inscripcion.findMany({
    where: { cursoId },
    include: { estudiante: true },
  })

  await db.notificacion.create({
    data: {
      titulo: 'Nueva Tarea Asignada',
      mensaje: `Se ha asignado la tarea "${titulo}". Fecha de entrega: ${new Date(fechaEntrega).toLocaleDateString()}`,
      tipo: 'TAREA',
      publicadoPor: user.id,
      destinatarios: {
        create: inscripciones.map(i => ({ userId: i.estudiante.userId })),
      },
    },
  })

  return NextResponse.json({ ok: true, tarea })
}
