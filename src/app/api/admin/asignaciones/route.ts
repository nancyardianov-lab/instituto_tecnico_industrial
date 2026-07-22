import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { UserRole } from '@prisma/client'

// GET - listar todas las asignaciones de cursos a docentes
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const docenteId = searchParams.get('docenteId')
  const cursoId = searchParams.get('cursoId')

  const where: any = {}
  if (docenteId) where.docenteId = docenteId
  if (cursoId) where.cursoId = cursoId

  const asignaciones = await db.cursoAsignado.findMany({
    where,
    include: {
      curso: { include: { carrera: { select: { nombre: true } } } },
      docente: { include: { user: { select: { name: true, email: true, codigo: true } } } },
    },
    orderBy: [{ anio: 'asc' }, { docente: { user: { name: 'asc' } } }],
  })

  return NextResponse.json({ asignaciones })
}

// POST - asignar un curso a un docente
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { cursoId, docenteId, anio } = body

    if (!cursoId || !docenteId || !anio) {
      return NextResponse.json({ error: 'Curso, docente y año son requeridos' }, { status: 400 })
    }

    // Verificar que existan
    const curso = await db.curso.findUnique({ where: { id: cursoId } })
    if (!curso) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })

    const docente = await db.docente.findUnique({ where: { id: docenteId } })
    if (!docente) return NextResponse.json({ error: 'Docente no encontrado' }, { status: 404 })

    // Crear asignación (si ya existe, @unique evita duplicados y lanza error)
    try {
      const asignacion = await db.cursoAsignado.create({
        data: { cursoId, docenteId, anio: parseInt(anio) },
      })
      return NextResponse.json({ ok: true, asignacion })
    } catch (e: any) {
      if (e?.code === 'P2002') {
        return NextResponse.json({
          error: 'Este curso ya está asignado a este docente en el año indicado',
        }, { status: 400 })
      }
      throw e
    }
  } catch (e: any) {
    console.error('[admin/asignaciones POST] Error:', e?.message || e)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
