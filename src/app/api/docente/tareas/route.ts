import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { UserRole } from '@prisma/client'

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

  const body = await req.json()
  const { titulo, descripcion, cursoId, fechaEntrega, punteoMaximo } = body

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

  const tarea = await db.tarea.create({
    data: {
      titulo,
      descripcion,
      cursoId,
      docenteId: user.docente.id,
      fechaEntrega: new Date(fechaEntrega),
      punteoMaximo: parseFloat(punteoMaximo) || 100,
    },
  })

  // Crear notificaciones a los estudiantes inscritos
  const inscripciones = await db.inscripcion.findMany({
    where: { cursoId },
    include: { estudiante: true },
  })
  
  const notif = await db.notificacion.create({
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
