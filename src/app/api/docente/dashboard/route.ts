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
                  horarios: true,
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

  // Reunir todos los horarios de los cursos del docente
  const DIAS = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO']
  const ahora = new Date()
  const diaHoy = DIAS[ahora.getDay()]

  type HorarioConInfo = {
    id: string
    curso: string
    carrera: string
    anio: number
    dia: string
    horaInicio: string
    horaFin: string
    aula: string | null
  }
  const todosLosHorarios: HorarioConInfo[] = []
  for (const ca of user.docente.cursos) {
    for (const h of ca.curso.horarios) {
      todosLosHorarios.push({
        id: h.id,
        curso: ca.curso.nombre,
        carrera: ca.curso.carrera?.nombre || 'Sin carrera',
        anio: ca.anio,
        dia: h.dia,
        horaInicio: h.horaInicio,
        horaFin: h.horaFin,
        aula: h.aula,
      })
    }
  }

  // Clases de hoy
  const horarioHoy = todosLosHorarios
    .filter(h => h.dia === diaHoy)
    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))

  // Próximas clases si hoy no hay
  let proximasClases: HorarioConInfo[] = horarioHoy
  let horarioHoyLabel = 'Hoy'
  if (horarioHoy.length === 0) {
    const DIAS_LABEL: Record<string, string> = {
      LUNES: 'Lunes', MARTES: 'Martes', MIERCOLES: 'Miércoles',
      JUEVES: 'Jueves', VIERNES: 'Viernes',
    }
    const DIAS_HABILES = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES']
    for (let i = 1; i <= 7; i++) {
      const proxIdx = (ahora.getDay() + i) % 7
      const proxDia = DIAS[proxIdx]
      if (DIAS_HABILES.includes(proxDia)) {
        const clases = todosLosHorarios
          .filter(h => h.dia === proxDia)
          .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
        if (clases.length > 0) {
          proximasClases = clases
          horarioHoyLabel = DIAS_LABEL[proxDia]
          break
        }
      }
    }
  }

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
    horarioHoy: proximasClases,
    horarioHoyLabel,
    ultimasEntregas,
  })
}
