import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { UserRole } from '@prisma/client'

// GET - listar estudiantes y notas de un curso
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== UserRole.DOCENTE) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const cursoId = searchParams.get('cursoId')
  if (!cursoId) {
    return NextResponse.json({ error: 'cursoId requerido' }, { status: 400 })
  }

  // Verificar asignación
  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: { docente: true },
  })
  if (!user || !user.docente) {
    return NextResponse.json({ error: 'Docente no encontrado' }, { status: 404 })
  }

  const asignado = await db.cursoAsignado.findFirst({
    where: { cursoId, docenteId: user.docente.id },
  })
  if (!asignado) {
    return NextResponse.json({ error: 'No asignado a este curso' }, { status: 403 })
  }

  const inscripciones = await db.inscripcion.findMany({
    where: { cursoId },
    include: {
      estudiante: {
        include: {
          user: { select: { name: true, codigo: true } },
          calificaciones: { where: { cursoId } },
        },
      },
    },
  })

  return NextResponse.json({
    estudiantes: inscripciones.map(i => ({
      estudianteId: i.estudiante.id,
      nombre: i.estudiante.user.name,
      codigo: i.estudiante.user.codigo,
      calificaciones: i.estudiante.calificaciones,
    })),
  })
}

// POST - guardar calificación
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== UserRole.DOCENTE) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await req.json()
  const { estudianteId, cursoId, unidad, nota, observaciones, publicada } = body

  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: { docente: true },
  })
  if (!user || !user.docente) {
    return NextResponse.json({ error: 'Docente no encontrado' }, { status: 404 })
  }

  const asignado = await db.cursoAsignado.findFirst({
    where: { cursoId, docenteId: user.docente.id },
  })
  if (!asignado) {
    return NextResponse.json({ error: 'No asignado a este curso' }, { status: 403 })
  }

  const calificacion = await db.calificacion.upsert({
    where: {
      estudianteId_cursoId_unidad: { estudianteId, cursoId, unidad: parseInt(unidad) },
    },
    update: {
      nota: parseFloat(nota),
      observaciones,
      publicada: publicada !== undefined ? publicada : true,
    },
    create: {
      estudianteId,
      cursoId,
      unidad: parseInt(unidad),
      nota: parseFloat(nota),
      observaciones,
      publicada: publicada !== undefined ? publicada : true,
    },
  })

  // Si se publica, crear notificación
  if (calificacion.publicada) {
    const est = await db.estudiante.findUnique({
      where: { id: estudianteId },
      include: { user: true },
    })
    const curso = await db.curso.findUnique({ where: { id: cursoId } })
    
    if (est && curso) {
      await db.notificacion.create({
        data: {
          titulo: 'Nueva Calificación Publicada',
          mensaje: `Se ha publicado su nota de la unidad ${unidad} del curso ${curso.nombre}: ${nota} puntos`,
          tipo: 'NOTA',
          publicadoPor: user.id,
          destinatarios: { create: { userId: est.userId } },
        },
      })
    }
  }

  return NextResponse.json({ ok: true, calificacion })
}
