import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { UserRole } from '@prisma/client'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== UserRole.DOCENTE) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: {
      docente: {
        include: {
          cursos: {
            include: {
              curso: {
                include: {
                  carrera: { select: { nombre: true } },
                  _count: { select: { inscripciones: true, tareas: true } },
                },
              },
            },
          },
        },
      },
    },
  })
  if (!user || !user.docente) {
    return NextResponse.json({ error: 'Docente no encontrado' }, { status: 404 })
  }

  // Tareas pendientes por revisar
  const cursoIds = user.docente.cursos.map(c => c.cursoId)
  const tareasPendientesRevision = await db.entrega.count({
    where: {
      tarea: { cursoId: { in: cursoIds } },
      calificacion: null,
    },
  })

  // Total de estudiantes
  const totalEstudiantes = await db.inscripcion.count({
    where: { cursoId: { in: cursoIds } },
  })

  // Tareas creadas
  const totalTareas = await db.tarea.count({
    where: { docenteId: user.docente.id },
  })

  // Clases del día
  const dias = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO']
  const diaHoy = dias[new Date().getDay()]
  
  const horariosHoy = await db.horario.findMany({
    where: {
      cursoId: { in: cursoIds },
      dia: diaHoy,
    },
    include: {
      curso: { select: { nombre: true } },
    },
    orderBy: { horaInicio: 'asc' },
  })

  // Últimas entregas
  const ultimasEntregas = await db.entrega.findMany({
    where: {
      tarea: { docenteId: user.docente.id },
      calificacion: null,
    },
    include: {
      tarea: { select: { titulo: true, curso: { select: { nombre: true } } } },
      estudiante: { include: { user: { select: { name: true } } } },
    },
    orderBy: { fechaEntrega: 'desc' },
    take: 5,
  })

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      foto: user.foto,
      codigo: user.codigo,
      especialidad: user.docente.especialidad,
      tituloProfesional: user.docente.tituloProfesional,
    },
    cursos: user.docente.cursos.map(c => ({
      id: c.curso.id,
      nombre: c.curso.nombre,
      anio: c.curso.anio,
      carrera: c.curso.carrera.nombre,
      totalEstudiantes: c.curso._count.inscripciones,
      totalTareas: c.curso._count.tareas,
    })),
    tareasPendientesRevision,
    totalEstudiantes,
    totalTareas,
    totalCursos: user.docente.cursos.length,
    horarioHoy: horariosHoy,
    ultimasEntregas,
  })
}
