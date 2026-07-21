import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { UserRole } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  
  const { searchParams } = new URL(req.url)
  const carreraId = searchParams.get('carreraId')
  
  const where: any = {}
  if (carreraId) where.carreraId = carreraId
  
  const cursos = await db.curso.findMany({
    where,
    include: {
      carrera: { select: { nombre: true, slug: true } },
      _count: { select: { asignaciones: true, inscripciones: true, tareas: true } },
    },
    orderBy: [{ carreraId: 'asc' }, { anio: 'asc' }],
  })
  return NextResponse.json({ cursos })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  
  try {
    const body = await req.json()
    const { nombre, carreraId, anio, descripcion, pensum } = body
    
    if (!nombre || !carreraId || !anio) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }
    
    const curso = await db.curso.create({
      data: {
        nombre, carreraId, anio: parseInt(anio),
        descripcion: descripcion || '',
        pensum: pensum || '[]',
      },
    })
    
    return NextResponse.json({ ok: true, curso })
  } catch (e) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
