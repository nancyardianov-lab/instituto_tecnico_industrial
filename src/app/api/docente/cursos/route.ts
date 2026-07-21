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
                  inscripciones: {
                    include: {
                      estudiante: { include: { user: { select: { name: true, email: true, codigo: true } } } },
                    },
                  },
                  tareas: true,
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

  return NextResponse.json({
    cursos: user.docente.cursos.map(c => ({
      id: c.curso.id,
      nombre: c.curso.nombre,
      anio: c.curso.anio,
      carrera: c.curso.carrera.nombre,
      pensum: JSON.parse(c.curso.pensum || '[]'),
      estudiantes: c.curso.inscripciones.map(i => ({
        id: i.estudiante.id,
        nombre: i.estudiante.user.name,
        email: i.estudiante.user.email,
        codigo: i.estudiante.user.codigo,
        anio: i.estudiante.anio,
        seccion: i.estudiante.seccion,
      })),
      tareas: c.curso.tareas,
    })),
  })
}
