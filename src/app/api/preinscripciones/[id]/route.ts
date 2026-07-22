import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { PreinscripcionStatus, UserRole, UserStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { sendEmail, tplPreinscripcionAceptada, tplPreinscripcionRechazada, tplInscripcionConfirmada } from '@/lib/email'

// PATCH - cambiar estado de preinscripción
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || session.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { status, notasRevision, fechaInscripcionPresencial } = body

    const preinscripcion = await db.preinscripcion.findUnique({
      where: { id },
      include: { carrera: true },
    })
    if (!preinscripcion) {
      return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
    }

    const updateData: any = {
      status: status as PreinscripcionStatus,
      revisadoPor: session.userId,
      fechaRevision: new Date(),
      notasRevision: notasRevision || null,
    }

    if (status === 'INSCRIPCION_CONFIRMADA') {
      updateData.fechaInscripcionPresencial = new Date()
      updateData.confirmadoPor = session.userId
      updateData.fechaConfirmacion = new Date()
    } else if (fechaInscripcionPresencial) {
      updateData.fechaInscripcionPresencial = new Date(fechaInscripcionPresencial)
    }

    const updated = await db.preinscripcion.update({
      where: { id },
      data: updateData,
    })

    // Si el estado es ACEPTADA, enviar correo con instrucciones
    if (status === 'ACEPTADA') {
      const tpl = tplPreinscripcionAceptada({
        estudianteNombre: preinscripcion.estudianteNombre,
        carreraNombre: preinscripcion.carreraNombre,
        fechaInscripcion: fechaInscripcionPresencial,
      })
      await sendEmail({
        to: preinscripcion.estudianteEmail,
        toName: preinscripcion.estudianteNombre,
        subject: tpl.subject,
        text: tpl.text,
        html: tpl.html,
        plantillaTipo: tpl.plantillaTipo,
      })

      // Notificar también al padre/encargado
      if (preinscripcion.padreEmail && preinscripcion.padreEmail !== preinscripcion.estudianteEmail) {
        await sendEmail({
          to: preinscripcion.padreEmail,
          toName: preinscripcion.padreNombre,
          subject: tpl.subject,
          text: tpl.text,
          html: tpl.html,
          plantillaTipo: tpl.plantillaTipo,
        })
      }
    }

    // Si el estado es INSCRIPCION_CONFIRMADA, crear usuario + enviar correo de activación
    if (status === 'INSCRIPCION_CONFIRMADA') {
      // Generar token de activación
      const activationToken = crypto.randomBytes(32).toString('hex')
      const activationExpires = new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 horas

      // Crear usuario
      const user = await db.user.create({
        data: {
          email: preinscripcion.estudianteEmail,
          name: preinscripcion.estudianteNombre,
          role: UserRole.ESTUDIANTE,
          status: UserStatus.ACEPTADO, // Espera activación de cuenta
          codigo: preinscripcion.estudianteCodigo,
          telefono: preinscripcion.estudianteTelefono,
          carreraId: preinscripcion.carreraId,
          activationToken,
          activationExpires,
          estudiante: {
            create: {
              padreNombre: preinscripcion.padreNombre,
              padreTelefono: preinscripcion.padreTelefono,
              padreEmail: preinscripcion.padreEmail,
              fechaInscripcion: new Date(),
              anio: 4,
              seccion: 'A',
            },
          },
        },
      })

      await db.preinscripcion.update({
        where: { id },
        data: { userId: user.id },
      })

      // Enviar correo real de activación de cuenta
      const tpl = tplInscripcionConfirmada({
        estudianteNombre: preinscripcion.estudianteNombre,
        estudianteEmail: preinscripcion.estudianteEmail,
        estudianteCodigo: preinscripcion.estudianteCodigo,
        activationToken,
      })
      await sendEmail({
        to: preinscripcion.estudianteEmail,
        toName: preinscripcion.estudianteNombre,
        subject: tpl.subject,
        text: tpl.text,
        html: tpl.html,
        plantillaTipo: tpl.plantillaTipo,
      })
    }

    if (status === 'RECHAZADA') {
      const tpl = tplPreinscripcionRechazada({
        estudianteNombre: preinscripcion.estudianteNombre,
        carreraNombre: preinscripcion.carreraNombre,
        notasRevision,
      })
      await sendEmail({
        to: preinscripcion.estudianteEmail,
        toName: preinscripcion.estudianteNombre,
        subject: tpl.subject,
        text: tpl.text,
        html: tpl.html,
        plantillaTipo: tpl.plantillaTipo,
      })
    }

    // Log de auditoría
    await db.auditLog.create({
      data: {
        userId: session.userId,
        accion: 'PREINSCRIPCION_ESTADO_CAMBIADO',
        modulo: 'PREINSCRIPCIONES',
        descripcion: `Preinscripción ${preinscripcion.estudianteNombre}: ${status}`,
        metadata: JSON.stringify({ preinscripcionId: id, status }),
      },
    })

    return NextResponse.json({ ok: true, preinscripcion: updated })
  } catch (e) {
    console.error('[preinscripciones/PATCH] Error:', e)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

// DELETE - eliminar una preinscripción del sistema
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession()
    if (!session || session.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { id } = await params
    const preinscripcion = await db.preinscripcion.findUnique({
      where: { id },
      select: { estudianteNombre: true, estudianteEmail: true, userId: true },
    })
    if (!preinscripcion) {
      return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
    }

    // Si la preinscripción tiene un usuario vinculado, no permitir borrar
    // sin antes advertir (el admin debe borrar el usuario por separado si lo desea)
    await db.preinscripcion.delete({ where: { id } })

    // Log de auditoría
    try {
      await db.auditLog.create({
        data: {
          userId: session.userId,
          accion: 'PREINSCRIPCION_ELIMINADA',
          modulo: 'PREINSCRIPCIONES',
          descripcion: `Preinscripción eliminada: ${preinscripcion.estudianteNombre} (${preinscripcion.estudianteEmail})`,
          metadata: JSON.stringify({ preinscripcionId: id }),
        },
      })
    } catch (logErr) {
      console.error('[preinscripciones DELETE] Error guardando log:', logErr)
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[preinscripciones DELETE] Error:', e?.message || e)
    return NextResponse.json({ error: 'Error del servidor', detalle: e?.message }, { status: 500 })
  }
}
