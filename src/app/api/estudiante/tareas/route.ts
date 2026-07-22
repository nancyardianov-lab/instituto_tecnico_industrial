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
    include: { estudiante: true },
  })
  if (!user || !user.estudiante) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  const cursoIds = (await db.inscripcion.findMany({
    where: { estudianteId: user.estudiante.id },
    select: { cursoId: true },
  })).map(i => i.cursoId)

  const tareas = await db.tarea.findMany({
    where: { cursoId: { in: cursoIds }, activa: true },
    include: {
      curso: { select: { nombre: true, carrera: { select: { nombre: true } } } },
      entregas: {
        where: { estudianteId: user.estudiante.id },
      },
    },
    orderBy: { fechaEntrega: 'asc' },
  })

  const tareasFormateadas = tareas.map(t => ({
    id: t.id,
    titulo: t.titulo,
    descripcion: t.descripcion,
    curso: t.curso.nombre,
    carrera: t.curso.carrera.nombre,
    fechaAsignacion: t.fechaAsignacion,
    fechaEntrega: t.fechaEntrega,
    punteoMaximo: t.punteoMaximo,
    archivoUrl: t.archivoUrl,
    archivoNombre: t.archivoNombre,
    archivoTipo: t.archivoTipo,
    entregada: t.entregas.length > 0,
    entrega: t.entregas[0] || null,
  }))

  return NextResponse.json({ tareas: tareasFormateadas })
}
