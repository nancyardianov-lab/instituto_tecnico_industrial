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
          calificaciones: {
            include: { curso: true },
            orderBy: [{ cursoId: 'asc' }, { unidad: 'asc' }],
          },
        },
      },
    },
  })

  if (!user || !user.estudiante) {
    return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 })
  }

  // Agrupar por curso
  const porCurso: Record<string, { curso: any; notas: any[]; promedio: number }> = {}
  for (const c of user.estudiante.calificaciones) {
    if (!porCurso[c.cursoId]) {
      porCurso[c.cursoId] = { curso: c.curso, notas: [], promedio: 0 }
    }
    porCurso[c.cursoId].notas.push(c)
  }
  
  Object.values(porCurso).forEach(p => {
    const publicadas = p.notas.filter(n => n.publicada)
    p.promedio = publicadas.length > 0
      ? publicadas.reduce((s, n) => s + n.nota, 0) / publicadas.length
      : 0
  })

  const promedioGeneral = Object.values(porCurso).length > 0
    ? Object.values(porCurso).reduce((s, p) => s + p.promedio, 0) / Object.values(porCurso).length
    : 0

  return NextResponse.json({
    porCurso: Object.values(porCurso),
    historial: user.estudiante.calificaciones,
    promedioGeneral: Math.round(promedioGeneral * 10) / 10,
  })
}
