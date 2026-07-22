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
          // Horarios del estudiante (tabla intermedia)
          horarios: {
            include: {
              horario: {
                include: {
                  curso: {
                    include: {
                      carrera: { select: { nombre: true } },
                      asignaciones: {
                        include: { docente: { include: { user: { select: { name: true } } } } },
                      },
                    },
                  },
                },
              },
            },
          },
          // También traemos las inscripciones para derivar horarios faltantes
          inscripciones: {
            include: {
              curso: {
                include: {
                  carrera: { select: { nombre: true } },
                  asignaciones: {
                    include: { docente: { include: { user: { select: { name: true } } } } },
                  },
                  horarios: true,
                },
              },
            },
          },
        },
      },
      carrera: { select: { nombre: true, slug: true } },
    },
  })
  if (!user || !user.estudiante) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  const dias = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES']
  const horarioPorDia: Record<string, any[]> = {}
  for (const d of dias) horarioPorDia[d] = []

  // Set de horariosIds ya procesados (para evitar duplicados)
  const horariosProcesados = new Set<string>()

  // 1. Procesar horarios de la tabla HorarioEstudiante (vínculo directo)
  for (const h of user.estudiante.horarios) {
    if (horariosProcesados.has(h.horario.id)) continue
    horariosProcesados.add(h.horario.id)
    const dia = h.horario.dia
    if (!horarioPorDia[dia]) horarioPorDia[dia] = []
    const docente = h.horario.curso.asignaciones[0]?.docente.user.name || 'Sin asignar'
    horarioPorDia[dia].push({
      id: h.horario.id,
      curso: h.horario.curso.nombre,
      horaInicio: h.horario.horaInicio,
      horaFin: h.horario.horaFin,
      aula: h.horario.aula,
      docente,
      carrera: h.horario.curso.carrera?.nombre,
      anio: h.horario.curso.anio,
    })
  }

  // 2. Sincronización: si el estudiante está inscrito en un curso pero no
  //    tiene sus horarios en HorarioEstudiante, igual los mostramos (y de
  //    paso creamos los registros faltantes en background).
  const horariosFaltantesCrear: { horarioId: string; estudianteId: string }[] = []
  for (const ins of user.estudiante.inscripciones) {
    for (const h of ins.curso.horarios) {
      if (horariosProcesados.has(h.id)) continue
      horariosProcesados.add(h.id)
      const dia = h.dia
      if (!horarioPorDia[dia]) horarioPorDia[dia] = []
      const docente = ins.curso.asignaciones[0]?.docente.user.name || 'Sin asignar'
      horarioPorDia[dia].push({
        id: h.id,
        curso: ins.curso.nombre,
        horaInicio: h.horaInicio,
        horaFin: h.horaFin,
        aula: h.aula,
        docente,
        carrera: ins.curso.carrera?.nombre,
        anio: ins.curso.anio,
      })
      // Registrar el vínculo faltante para futuras consultas
      horariosFaltantesCrear.push({ horarioId: h.id, estudianteId: user.estudiante.id })
    }
  }

  // Crear registros HorarioEstudiante faltantes en background (no bloquea respuesta)
  if (horariosFaltantesCrear.length > 0) {
    db.horarioEstudiante.createMany({
      data: horariosFaltantesCrear,
      skipDuplicates: true,
    }).catch(e => console.error('[estudiante/horario] createMany background:', e?.message || e))
  }

  for (const d of dias) {
    horarioPorDia[d].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
  }

  return NextResponse.json({
    horarioPorDia,
    dias,
    carrera: user.carrera,
    anio: user.estudiante.anio,
  })
}
