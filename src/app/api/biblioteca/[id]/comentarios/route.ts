import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const libro = await db.libro.findUnique({
    where: { id },
    include: {
      comentarios: {
        where: { padreId: null, reportado: false },
        include: {
          user: { select: { id: true, name: true, foto: true } },
          _count: { select: { comentarios: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  if (!libro) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json({ libro })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const { texto, calificacion, padreId } = body

  if (!texto) {
    return NextResponse.json({ error: 'Comentario requerido' }, { status: 400 })
  }

  const comentario = await db.comentario.create({
    data: {
      libroId: id,
      userId: session.userId,
      texto,
      calificacion: calificacion || 5,
      padreId,
    },
  })

  return NextResponse.json({ ok: true, comentario })
}
