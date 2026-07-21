import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { UserRole } from '@prisma/client'

// Horario semanal del docente: clases que imparte
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
                  inscripciones: { select: { id: true } },
                },
              },
            },
          },
        },
      },
    },
  })
  if (!user || !user.docente) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  const dias = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES']
  const horarioPorDia: Record<string, any[]> = {}
  for (const d of dias) horarioPorDia[d] = []

  // Lista de cursos asignados
  const cursosAsignados = user.docente.cursos.map((ca: any) => ({
    id: ca.curso.id,
    nombre: ca.curso.nombre,
    carrera: ca.curso.carrera?.nombre || 'Sin carrera',
    anio: ca.anio,
    totalEstudiantes: ca.curso.inscripciones?.length || 0,
  }))

  // Recorrer horarios de los cursos asignados
  for (const ca of user.docente.cursos) {
    for (const h of ca.curso.horarios) {
      const dia = h.dia
      if (!horarioPorDia[dia]) horarioPorDia[dia] = []
      horarioPorDia[dia].push({
        id: h.id,
        curso: ca.curso.nombre,
        carrera: ca.curso.carrera?.nombre || 'Sin carrera',
        anio: ca.anio,
        horaInicio: h.horaInicio,
        horaFin: h.horaFin,
        aula: h.aula,
      })
    }
  }

  for (const d of dias) {
    horarioPorDia[d].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
  }

  return NextResponse.json({
    horarioPorDia,
    dias,
    cursosAsignados,
    totalCursos: cursosAsignados.length,
  })
}
