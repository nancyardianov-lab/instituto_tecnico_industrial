import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { UserRole } from '@prisma/client'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  const eventos = await db.evento.findMany({
    orderBy: { fecha: 'desc' },
  })
  return NextResponse.json({ eventos })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  try {
    const body = await req.json()
    const { titulo, descripcion, fecha, hora, lugar, imagen } = body
    if (!titulo || !descripcion || !fecha || !hora || !lugar) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }
    const evento = await db.evento.create({
      data: {
        titulo,
        descripcion,
        fecha: new Date(fecha),
        hora,
        lugar,
        imagen: imagen || null,
      },
    })
    return NextResponse.json({ ok: true, evento })
  } catch (e: any) {
    console.error('[admin/eventos POST] Error:', e?.message || e)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
