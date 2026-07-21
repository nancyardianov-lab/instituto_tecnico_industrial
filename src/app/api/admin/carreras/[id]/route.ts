import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { UserRole } from '@prisma/client'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  
  try {
    const { id } = await params
    const body = await req.json()
    const { nombre, descripcion, objetivo, perfilEgresado, campoLaboral, duracion, imagen, galeria, activa } = body
    
    const carrera = await db.carrera.update({
      where: { id },
      data: { nombre, descripcion, objetivo, perfilEgresado, campoLaboral, duracion, imagen, galeria, activa },
    })
    
    return NextResponse.json({ ok: true, carrera })
  } catch (e) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  
  try {
    const { id } = await params
    await db.carrera.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
