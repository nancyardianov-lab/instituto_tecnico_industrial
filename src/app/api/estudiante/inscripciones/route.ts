import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { UserRole } from '@prisma/client'

// GET - devuelve las materias disponibles para que el estudiante se inscriba,
// filtradas por su carrera y año. Solo materias de SU carrera y SU año.
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== UserRole.ESTUDIANTE) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: {
      estudiante: { include: { inscripciones: true } },
    },
  })
  if (!user || !user.estudiante) {
    return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 })
  }

  if (!user.carreraId) {
    return NextResponse.json({
      error: 'No tiene carrera asignada. Contacte al administrador.',
      materias: [],
      inscripciones: [],
    })
  }

  const anio = user.estudiante.anio || 4

  // Materias de SU carrera y SU año
  const materias = await db.curso.findMany({
    where: {
      carreraId: user.carreraId,
      anio,
      activo: true,
    },
    include: {
      asignaciones: { include: { docente: { include: { user: { select: { name: true } } } } } },
      _count: { select: { inscripciones: true } },
    },
    orderBy: { nombre: 'asc' },
  })

  const yaInscritoIds = new Set(user.estudiante.inscripciones.map(i => i.cursoId))

  return NextResponse.json({
    materias: materias.map(m => ({
      id: m.id,
      nombre: m.nombre,
      descripcion: m.descripcion,
      docente: m.asignaciones[0]?.docente.user.name || 'Sin docente asignado',
      tieneDocente: m.asignaciones.length > 0,
      totalInscritos: m._count.inscripciones,
      yaInscrito: yaInscritoIds.has(m.id),
    })),
    carrera: user.carrera,
    anio,
    inscripciones: user.estudiante.inscripciones.map(i => ({
      id: i.id,
      cursoId: i.cursoId,
      anio: i.anio,
      fechaInscripcion: i.fechaInscripcion,
    })),
  })
}

// POST - inscribir al estudiante en una materia
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== UserRole.ESTUDIANTE) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { cursoId } = body
    if (!cursoId) {
      return NextResponse.json({ error: 'cursoId es requerido' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      include: { estudiante: true },
    })
    if (!user || !user.estudiante) {
      return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 })
    }

    const curso = await db.curso.findUnique({ where: { id: cursoId } })
    if (!curso) {
      return NextResponse.json({ error: 'Materia no encontrada' }, { status: 404 })
    }

    // Validar que la materia sea de SU carrera y SU año
    if (curso.carreraId !== user.carreraId) {
      return NextResponse.json({
        error: 'No puede inscribirse en una materia de otra carrera.',
      }, { status: 400 })
    }
    if (curso.anio !== user.estudiante.anio) {
      return NextResponse.json({
        error: `No puede inscribirse en una materia de ${curso.anio}° año si usted está en ${user.estudiante.anio}° año.`,
      }, { status: 400 })
    }

    // Crear inscripción (si ya existe, @unique evita duplicados)
    try {
      const ins = await db.inscripcion.create({
        data: {
          estudianteId: user.estudiante.id,
          cursoId,
          anio: curso.anio,
        },
      })

      // Inscribir automáticamente al estudiante en TODOS los horarios de ese curso
      const horarios = await db.horario.findMany({ where: { cursoId } })
      if (horarios.length > 0) {
        await db.horarioEstudiante.createMany({
          data: horarios.map(h => ({ horarioId: h.id, estudianteId: user.estudiante.id })),
          skipDuplicates: true,
        })
      }

      return NextResponse.json({ ok: true, inscripcion: ins })
    } catch (e: any) {
      if (e?.code === 'P2002') {
        return NextResponse.json({
          error: 'Ya está inscrito en esta materia.',
        }, { status: 400 })
      }
      throw e
    }
  } catch (e: any) {
    console.error('[estudiante/inscripciones POST] Error:', e?.message || e)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

// DELETE - desinscribir al estudiante de una materia
export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== UserRole.ESTUDIANTE) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const cursoId = searchParams.get('cursoId')
    if (!cursoId) {
      return NextResponse.json({ error: 'cursoId es requerido' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      include: { estudiante: true },
    })
    if (!user || !user.estudiante) {
      return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 })
    }

    // Eliminar inscripción
    await db.inscripcion.deleteMany({
      where: { estudianteId: user.estudiante.id, cursoId },
    })

    // Eliminar registros de HorarioEstudiante asociados
    const horariosDelCurso = await db.horario.findMany({
      where: { cursoId },
      select: { id: true },
    })
    if (horariosDelCurso.length > 0) {
      await db.horarioEstudiante.deleteMany({
        where: {
          estudianteId: user.estudiante.id,
          horarioId: { in: horariosDelCurso.map(h => h.id) },
        },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[estudiante/inscripciones DELETE] Error:', e?.message || e)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
