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
                  horarios: true,
                },
              },
            },
          },
          calificaciones: { include: { curso: { select: { nombre: true } } } },
          horarios: { include: { horario: { include: { curso: { select: { nombre: true, anio: true } } } } } },
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

  // Tareas pendientes (no entregadas), incluyendo vencidas
  const cursoIds = user.estudiante.inscripciones.map(i => i.cursoId)
  const tareasPendientes = await db.tarea.findMany({
    where: {
      cursoId: { in: cursoIds },
      activa: true,
      entregas: { none: { estudianteId: user.estudiante.id } },
    },
    include: {
      curso: { select: { nombre: true } },
    },
    orderBy: { fechaEntrega: 'asc' },
    take: 10,
  })

  // Marcar como vencidas las que ya pasaron su fecha
  const ahora = new Date()
  const tareasPendientesMarcadas = tareasPendientes.map(t => ({
    ...t,
    vencida: new Date(t.fechaEntrega) < ahora,
  }))

  // Construir horarios del estudiante desde inscripciones (más confiable
  // que solo HorarioEstudiante, que puede no estar sincronizado)
  const DIAS = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO']
  const horariosProcesados = new Set<string>()
  type HorarioConDocente = {
    id: string
    curso: string
    dia: string
    horaInicio: string
    horaFin: string
    aula: string | null
    docente: string
    anio: number
  }
  const todosLosHorarios: HorarioConDocente[] = []

  // 1. Horarios vinculados vía HorarioEstudiante
  for (const h of user.estudiante.horarios) {
    if (horariosProcesados.has(h.horario.id)) continue
    horariosProcesados.add(h.horario.id)
    const cursoConAsig = user.estudiante.inscripciones.find(i => i.cursoId === h.horario.cursoId)?.curso
    const docente = cursoConAsig?.asignaciones?.[0]?.docente.user.name || 'Sin asignar'
    todosLosHorarios.push({
      id: h.horario.id,
      curso: h.horario.curso.nombre,
      dia: h.horario.dia,
      horaInicio: h.horario.horaInicio,
      horaFin: h.horario.horaFin,
      aula: h.horario.aula,
      docente,
      anio: h.horario.curso.anio,
    })
  }
  // 2. Horarios derivados de inscripciones (fallback / sincronización)
  const horariosFaltantesCrear: { horarioId: string; estudianteId: string }[] = []
  for (const ins of user.estudiante.inscripciones) {
    for (const h of ins.curso.horarios) {
      if (horariosProcesados.has(h.id)) continue
      horariosProcesados.add(h.id)
      const docente = ins.curso.asignaciones?.[0]?.docente.user.name || 'Sin asignar'
      todosLosHorarios.push({
        id: h.id,
        curso: ins.curso.nombre,
        dia: h.dia,
        horaInicio: h.horaInicio,
        horaFin: h.horaFin,
        aula: h.aula,
        docente,
        anio: ins.curso.anio,
      })
      horariosFaltantesCrear.push({ horarioId: h.id, estudianteId: user.estudiante.id })
    }
  }
  // Crear vínculos faltantes en background
  if (horariosFaltantesCrear.length > 0) {
    db.horarioEstudiante.createMany({
      data: horariosFaltantesCrear,
      skipDuplicates: true,
    }).catch(e => console.error('[estudiante/dashboard] createMany background:', e?.message || e))
  }

  // Día de hoy y próximas clases
  const diaHoy = DIAS[ahora.getDay()]
  const horarioHoy = todosLosHorarios
    .filter(h => h.dia === diaHoy)
    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))

  // Próximas clases: si no hay clases hoy, buscar el siguiente día con clases
  let proximasClases: HorarioConDocente[] = []
  let proximaFechaLabel = ''
  if (horarioHoy.length > 0) {
    proximasClases = horarioHoy
    proximaFechaLabel = 'Hoy'
  } else {
    // Buscar próximo día hábil con clases
    const DIAS_LABEL: Record<string, string> = {
      LUNES: 'Lunes', MARTES: 'Martes', MIERCOLES: 'Miércoles',
      JUEVES: 'Jueves', VIERNES: 'Viernes',
    }
    const DIAS_HABILES = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES']
    // empezamos a buscar desde mañana
    for (let i = 1; i <= 7; i++) {
      const proxIdx = (ahora.getDay() + i) % 7
      const proxDia = DIAS[proxIdx]
      if (DIAS_HABILES.includes(proxDia)) {
        const clases = todosLosHorarios
          .filter(h => h.dia === proxDia)
          .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
        if (clases.length > 0) {
          proximasClases = clases
          proximaFechaLabel = DIAS_LABEL[proxDia]
          break
        }
      }
    }
  }

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
    tareasPendientes: tareasPendientesMarcadas,
    horarioHoy: proximasClases,
    horarioHoyLabel: proximaFechaLabel,
    totalTareasPendientes: tareasPendientesMarcadas.length,
    notificacionesNoLeidas,
    totalCursos: user.estudiante.inscripciones.length,
    totalCalificaciones: califs.length,
  })
}
