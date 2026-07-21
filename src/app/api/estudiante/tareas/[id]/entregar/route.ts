import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { UserRole } from '@prisma/client'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== UserRole.ESTUDIANTE) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id: tareaId } = await params
  const body = await req.json()
  const { comentario, archivoUrl } = body

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
      fechaEntrega: new Date(),
    },
    create: {
      tareaId,
      estudianteId: user.estudiante.id,
      comentario,
      archivoUrl,
    },
  })

  return NextResponse.json({ ok: true, entrega })
}
