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

// POST - asignar una materia individual a un docente.
// Acepta DOS modos:
//   Modo A (legacy): { cursoId, docenteId, anio }
//   Modo B (nuevo, recomendado): { materiaNombre, carreraId, anio, docenteId }
//     → el backend hace find-or-create del Curso por (nombre, carreraId, anio)
// REGLA: solo UN docente por materia. Si la materia ya tiene docente
// asignado, se devuelve error indicando qué docente lo tiene.
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { cursoId, docenteId, anio, materiaNombre, carreraId } = body

    if (!docenteId || !anio) {
      return NextResponse.json({ error: 'Docente y año son requeridos', status: 400 }, { status: 400 })
    }

    // Verificar docente
    const docente = await db.docente.findUnique({ where: { id: docenteId } })
    if (!docente) return NextResponse.json({ error: 'Docente no encontrado' }, { status: 404 })

    let cursoIdFinal: string = cursoId

    // MODO B: si viene materiaNombre + carreraId, hacer find-or-create
    if (!cursoIdFinal && materiaNombre && carreraId) {
      const nombreLimpio = String(materiaNombre).trim()
      if (nombreLimpio.length < 2) {
        return NextResponse.json({ error: 'El nombre de la materia es muy corto' }, { status: 400 })
      }
      const carrera = await db.carrera.findUnique({ where: { id: carreraId } })
      if (!carrera) return NextResponse.json({ error: 'Carrera no encontrada' }, { status: 404 })

      // Buscar materia existente con mismo nombre + carrera + año (case-insensitive exact)
      const existente = await db.curso.findFirst({
        where: {
          nombre: { equals: nombreLimpio, mode: 'insensitive' },
          carreraId,
          anio: parseInt(anio),
        },
      })
      if (existente) {
        cursoIdFinal = existente.id
      } else {
        // Crear la materia individual
        const nueva = await db.curso.create({
          data: {
            nombre: nombreLimpio,
            carreraId,
            anio: parseInt(anio),
            descripcion: `Materia de ${anio}° año`,
            pensum: '[]',
            activo: true,
          },
        })
        cursoIdFinal = nueva.id
      }
    }

    if (!cursoIdFinal) {
      return NextResponse.json({
        error: 'Debe indicar el nombre de la materia, carrera y año (o un cursoId)',
      }, { status: 400 })
    }

    const curso = await db.curso.findUnique({ where: { id: cursoIdFinal } })
    if (!curso) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })

    // Verificar si la materia ya tiene un docente asignado (regla: 1 docente por materia)
    const existente = await db.cursoAsignado.findFirst({
      where: { cursoId: cursoIdFinal },
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
        data: { cursoId: cursoIdFinal, docenteId, anio: parseInt(anio) },
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
    return NextResponse.json({ error: 'Error del servidor: ' + (e?.message || 'desconocido') }, { status: 500 })
  }
}
