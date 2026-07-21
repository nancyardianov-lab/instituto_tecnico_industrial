import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { NotificacionTipo } from '@prisma/client'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ notificaciones: [] })
  }

  // Globales + específicas al usuario
  const notifs = await db.notificacion.findMany({
    where: {
      OR: [
        { esGlobal: true },
        { destinatarios: { some: { userId: session.userId } } },
      ],
    },
    include: {
      destinatarios: {
        where: { userId: session.userId },
        select: { leida: true, fechaLectura: true },
      },
    },
    orderBy: { fechaPublicacion: 'desc' },
    take: 30,
  })

  return NextResponse.json({ notificaciones: notifs })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { titulo, mensaje, tipo, esGlobal } = await req.json()
  if (!titulo || !mensaje) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const notif = await db.notificacion.create({
    data: {
      titulo,
      mensaje,
      tipo: (tipo || 'GENERAL') as NotificacionTipo,
      esGlobal: esGlobal !== false,
      publicadoPor: session.userId,
    },
  })

  // Si no es global, enviar a todos los usuarios activos
  if (!esGlobal) {
    const usuarios = await db.user.findMany({
      where: { status: 'ACTIVO' },
      select: { id: true },
    })
    await db.notificacionUsuario.createMany({
      data: usuarios.map(u => ({ notificacionId: notif.id, userId: u.id })),
    })
  }

  return NextResponse.json({ ok: true, notificacion: notif })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { notificacionId } = await req.json()
  
  // Marcar como leída
  const existing = await db.notificacionUsuario.findUnique({
    where: { notificacionId_userId: { notificacionId, userId: session.userId } },
  })

  if (existing) {
    await db.notificacionUsuario.update({
      where: { id: existing.id },
      data: { leida: true, fechaLectura: new Date() },
    })
  } else {
    // Si es global y no existe entrada, crearla como leída
    await db.notificacionUsuario.create({
      data: { notificacionId, userId: session.userId, leida: true, fechaLectura: new Date() },
    })
  }

  return NextResponse.json({ ok: true })
}
