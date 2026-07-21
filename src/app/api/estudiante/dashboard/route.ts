import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { UserRole } from '@prisma/client'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== UserRole.ESTUDIANTE) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: {
      estudiante: {
        include: {
          inscripciones: {
            include: {
              curso: {
                include: {
                  carrera: { select: { nombre: true } },
                  asignaciones: { include: { docente: { include: { user: { select: { name: true } } } } } },
                },
              },
            },
          },
          calificaciones: { include: { curso: { select: { nombre: true } } } },
          horarios: { include: { horario: { include: { curso: { select: { nombre: true } } } } } },
          tareasEntregadas: { include: { tarea: { select: { titulo: true, fechaEntrega: true, curso: { select: { nombre: true } } } } } },
        },
      },
      carrera: { select: { nombre: true, slug: true } },
    },
  })

  if (!user || !user.estudiante) {
    return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 })
  }

  // Calcular promedio general
  const califs = user.estudiante.calificaciones.filter(c => c.publicada)
  const promedioGeneral = califs.length > 0
    ? califs.reduce((sum, c) => sum + c.nota, 0) / califs.length
    : 0

  // Promedio por curso
  const porCurso: Record<string, { nombre: string; notas: number[]; promedio: number }> = {}
  for (const c of califs) {
    if (!porCurso[c.cursoId]) {
      porCurso[c.cursoId] = { nombre: c.curso.nombre, notas: [], promedio: 0 }
    }
    porCurso[c.cursoId].notas.push(c.nota)
  }
  Object.values(porCurso).forEach(p => {
    p.promedio = p.notas.reduce((a, b) => a + b, 0) / p.notas.length
  })

  // Tareas pendientes
  const cursoIds = user.estudiante.inscripciones.map(i => i.cursoId)
  const tareasPendientes = await db.tarea.findMany({
    where: {
      cursoId: { in: cursoIds },
      activa: true,
      fechaEntrega: { gte: new Date() },
      entregas: { none: { estudianteId: user.estudiante.id } },
    },
    include: {
      curso: { select: { nombre: true } },
    },
    orderBy: { fechaEntrega: 'asc' },
    take: 5,
  })

  // Horario de hoy
  const dias = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO']
  const diaHoy = dias[new Date().getDay()]
  const horarioHoy = user.estudiante.horarios
    .filter(h => h.horario.dia === diaHoy)
    .map(h => ({
      id: h.horario.id,
      curso: h.horario.curso.nombre,
      dia: h.horario.dia,
      horaInicio: h.horario.horaInicio,
      horaFin: h.horario.horaFin,
      aula: h.horario.aula,
    }))
    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))

  // Notificaciones no leídas
  const notificacionesNoLeidas = await db.notificacionUsuario.count({
    where: { userId: user.id, leida: false },
  })

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      foto: user.foto,
      codigo: user.codigo,
      carrera: user.carrera,
    },
    promedioGeneral: Math.round(promedioGeneral * 10) / 10,
    promedioPorCurso: Object.entries(porCurso).map(([id, p]) => ({ cursoId: id, ...p })),
    tareasPendientes,
    horarioHoy,
    notificacionesNoLeidas,
    totalCursos: user.estudiante.inscripciones.length,
    totalCalificaciones: califs.length,
  })
}
