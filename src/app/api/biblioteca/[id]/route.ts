import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { eliminarArchivo } from '@/lib/storage'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const libro = await db.libro.findUnique({
    where: { id },
    include: {
      _count: { select: { comentarios: true, favoritos: true } },
      comentarios: {
        where: { reportado: false, padreId: null },
        include: { user: { select: { name: true, foto: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  if (!libro) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json({ libro })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session || (session.role !== UserRole.ADMIN && session.role !== UserRole.DOCENTE)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id } = await params
  const libro = await db.libro.findUnique({ where: { id } })
  if (!libro) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  // Borrar archivos físicos/Blob usando el helper de storage
  await eliminarArchivo(libro.archivoUrl)
  await eliminarArchivo(libro.portada)

  await db.libro.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

// Incrementar vistas o descargas
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const accion = body.accion // 'vista' | 'descarga'
  if (accion !== 'vista' && accion !== 'descarga') {
    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
  }
  await db.libro.update({
    where: { id },
    data: accion === 'vista' ? { vistas: { increment: 1 } } : { descargas: { increment: 1 } },
  })
  return NextResponse.json({ ok: true })
}
