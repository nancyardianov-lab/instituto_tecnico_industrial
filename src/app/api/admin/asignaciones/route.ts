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

// POST - asignar una materia individual a un docente
// REGLA: solo UN docente por materia. Si la materia ya tiene docente
// asignado, se devuelve error indicando qué docente lo tiene.
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

    // Verificar si la materia ya tiene un docente asignado (regla: 1 docente por materia)
    const existente = await db.cursoAsignado.findFirst({
      where: { cursoId },
      include: { docente: { include: { user: { select: { name: true } } } } },
    })
    if (existente && existente.docenteId !== docenteId) {
      return NextResponse.json({
        error: `Esta materia ya está asignada a "${existente.docente.user.name}". Una materia solo puede tener un docente. Elimine la asignación anterior antes de asignarla a otro docente.`,
      }, { status: 400 })
    }

    // Crear asignación (si ya existe exactamente igual, @unique evita duplicados)
    try {
      const asignacion = await db.cursoAsignado.create({
        data: { cursoId, docenteId, anio: parseInt(anio) },
      })
      return NextResponse.json({ ok: true, asignacion })
    } catch (e: any) {
      if (e?.code === 'P2002') {
        return NextResponse.json({
          error: 'Esta materia ya está asignada a este docente en el año indicado',
        }, { status: 400 })
      }
      throw e
    }
  } catch (e: any) {
    console.error('[admin/asignaciones POST] Error:', e?.message || e)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
