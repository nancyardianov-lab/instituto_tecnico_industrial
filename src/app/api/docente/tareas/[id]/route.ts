import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { UserRole } from '@prisma/client'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== UserRole.DOCENTE) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id } = await params
  const tarea = await db.tarea.findUnique({
    where: { id },
    include: {
      curso: { select: { nombre: true } },
      entregas: {
        include: {
          estudiante: { include: { user: { select: { name: true, codigo: true } } } },
        },
        orderBy: { fechaEntrega: 'desc' },
      },
    },
  })
  if (!tarea) {
    return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })
  }
  return NextResponse.json({ tarea })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== UserRole.DOCENTE) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id } = await params
  await db.tarea.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
