import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { UserRole } from '@prisma/client'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  try {
    const { id } = await params
    const body = await req.json()
    const { titulo, resumen, contenido, imagen, destacada, publicada } = body
    const noticia = await db.noticia.update({
      where: { id },
      data: {
        titulo: titulo ?? undefined,
        resumen: resumen ?? undefined,
        contenido: contenido ?? undefined,
        imagen: imagen ?? undefined,
        destacada: destacada ?? undefined,
        publicada: publicada ?? undefined,
      },
    })
    return NextResponse.json({ ok: true, noticia })
  } catch (e: any) {
    console.error('[admin/noticias PUT] Error:', e?.message || e)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  try {
    const { id } = await params
    await db.noticia.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[admin/noticias DELETE] Error:', e?.message || e)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
