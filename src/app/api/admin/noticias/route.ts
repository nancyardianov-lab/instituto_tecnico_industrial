import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { UserRole } from '@prisma/client'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  const noticias = await db.noticia.findMany({
    orderBy: { fechaPublicacion: 'desc' },
  })
  return NextResponse.json({ noticias })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  try {
    const body = await req.json()
    const { titulo, resumen, contenido, imagen, destacada } = body
    if (!titulo || !resumen || !contenido) {
      return NextResponse.json({ error: 'Título, resumen y contenido son requeridos' }, { status: 400 })
    }
    const noticia = await db.noticia.create({
      data: {
        titulo,
        resumen,
        contenido,
        imagen: imagen || null,
        destacada: !!destacada,
        publicada: true,
      },
    })
    return NextResponse.json({ ok: true, noticia })
  } catch (e: any) {
    console.error('[admin/noticias POST] Error:', e?.message || e)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
