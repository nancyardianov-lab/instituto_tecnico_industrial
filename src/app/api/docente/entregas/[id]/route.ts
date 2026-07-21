import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { UserRole } from '@prisma/client'

// Calificar / retroalimentar entrega
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== UserRole.DOCENTE) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const { calificacion, comentarioDocente } = body

  const entrega = await db.entrega.findUnique({
    where: { id },
    include: { tarea: true },
  })
  if (!entrega) {
    return NextResponse.json({ error: 'Entrega no encontrada' }, { status: 404 })
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: { docente: true },
  })
  if (!user || !user.docente) {
    return NextResponse.json({ error: 'Docente no encontrado' }, { status: 404 })
  }

  // Verificar que la tarea es del docente
  if (entrega.tarea.docenteId !== user.docente.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const updated = await db.entrega.update({
    where: { id },
    data: {
      calificacion: parseFloat(calificacion),
      comentarioDocente,
      calificadaEn: new Date(),
    },
  })

  return NextResponse.json({ ok: true, entrega: updated })
}
