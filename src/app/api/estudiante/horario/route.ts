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
          horarios: {
            include: {
              horario: {
                include: {
                  curso: {
                    include: {
                      asignaciones: {
                        include: { docente: { include: { user: { select: { name: true } } } } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  if (!user || !user.estudiante) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  const dias = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES']
  const horarioPorDia: Record<string, any[]> = {}
  for (const d of dias) horarioPorDia[d] = []
  
  for (const h of user.estudiante.horarios) {
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
    })
  }
  
  for (const d of dias) {
    horarioPorDia[d].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
  }

  return NextResponse.json({ horarioPorDia, dias })
}
