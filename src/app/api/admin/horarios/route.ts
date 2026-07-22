import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { UserRole } from '@prisma/client'

// GET - listar horarios (opcional filtrar por cursoId)
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const cursoId = searchParams.get('cursoId')

  const where: any = {}
  if (cursoId) where.cursoId = cursoId

  const horarios = await db.horario.findMany({
    where,
    include: {
      curso: { include: { carrera: { select: { nombre: true } } } },
      _count: { select: { estudiantes: true } },
    },
    orderBy: [{ dia: 'asc' }, { horaInicio: 'asc' }],
  })

  return NextResponse.json({ horarios })
}

// POST - crear un horario para un curso
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { cursoId, dia, horaInicio, horaFin, aula } = body

    if (!cursoId || !dia || !horaInicio || !horaFin) {
      return NextResponse.json({ error: 'Curso, día, hora de inicio y hora de fin son requeridos' }, { status: 400 })
    }

    const diasValidos = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES']
    if (!diasValidos.includes(dia)) {
      return NextResponse.json({ error: 'Día inválido' }, { status: 400 })
    }

    if (horaInicio >= horaFin) {
      return NextResponse.json({ error: 'La hora de inicio debe ser menor que la hora de fin' }, { status: 400 })
    }

    const curso = await db.curso.findUnique({ where: { id: cursoId } })
    if (!curso) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })

    const horario = await db.horario.create({
      data: {
        cursoId,
        dia,
        horaInicio,
        horaFin,
        aula: aula || null,
      },
    })

    // Inscribir automáticamente a todos los estudiantes del curso en este horario
    const inscripciones = await db.inscripcion.findMany({
      where: { cursoId },
      select: { estudianteId: true },
    })
    if (inscripciones.length > 0) {
      await db.horarioEstudiante.createMany({
        data: inscripciones.map(i => ({ horarioId: horario.id, estudianteId: i.estudianteId })),
        skipDuplicates: true,
      })
    }

    return NextResponse.json({ ok: true, horario })
  } catch (e: any) {
    console.error('[admin/horarios POST] Error:', e?.message || e)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
