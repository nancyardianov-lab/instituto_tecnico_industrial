import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { UserRole } from '@prisma/client'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  
  const carreras = await db.carrera.findMany({
    include: {
      _count: { select: { cursos: true, estudiantes: true } },
    },
    orderBy: { nombre: 'asc' },
  })
  return NextResponse.json({ carreras })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  
  try {
    const body = await req.json()
    const { nombre, slug, descripcion, objetivo, perfilEgresado, campoLaboral, duracion, imagen, galeria } = body
    
    if (!nombre || !slug) {
      return NextResponse.json({ error: 'Nombre y slug requeridos' }, { status: 400 })
    }
    
    const carrera = await db.carrera.create({
      data: {
        nombre, slug, descripcion, objetivo, perfilEgresado, campoLaboral,
        duracion: duracion || '3 años',
        imagen, galeria: galeria || '[]',
      },
    })
    
    return NextResponse.json({ ok: true, carrera })
  } catch (e) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
