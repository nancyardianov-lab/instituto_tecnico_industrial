import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { id } = await params
  const existing = await db.favoritoLibro.findUnique({
    where: { libroId_userId: { libroId: id, userId: session.userId } },
  })

  if (existing) {
    await db.favoritoLibro.delete({ where: { id: existing.id } })
    return NextResponse.json({ ok: true, favorito: false })
  } else {
    await db.favoritoLibro.create({
      data: { libroId: id, userId: session.userId },
    })
    return NextResponse.json({ ok: true, favorito: true })
  }
}
