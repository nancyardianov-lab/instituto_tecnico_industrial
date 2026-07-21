import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { UserRole, UserStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { sendEmail, tplDocenteAprobado, tplInscripcionConfirmada } from '@/lib/email'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role')
  const status = searchParams.get('status')
  const search = searchParams.get('search')

  const where: any = {}
  if (role && role !== 'TODOS') where.role = role
  if (status && status !== 'TODOS') where.status = status
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { codigo: { contains: search } },
    ]
  }

  const usuarios = await db.user.findMany({
    where,
    include: {
      estudiante: true,
      docente: true,
      carrera: { select: { nombre: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ usuarios })
}

// PATCH - cambiar estado de usuario (aprobar/rechazar/bloquear/activar)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { userId, action, notas } = await req.json()
    
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { docente: true, estudiante: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    let newStatus: UserStatus = user.status
    let extraData: any = {}
    // Para acciones que requieren envío de correo real
    let emailTpl: { subject: string; text: string; html: string; plantillaTipo: string } | null = null

    switch (action) {
      case 'aprobar_docente': {
        // Generar token de activación
        const activationToken = crypto.randomBytes(32).toString('hex')
        const activationExpires = new Date(Date.now() + 48 * 60 * 60 * 1000)
        newStatus = UserStatus.ACEPTADO
        extraData = { activationToken, activationExpires }
        emailTpl = tplDocenteAprobado({
          nombre: user.name,
          email: user.email,
          activationToken,
        })
        break
      }
      case 'rechazar_docente': {
        newStatus = UserStatus.RECHAZADO
        const subject = 'Actualización de su Solicitud de Cuenta Docente'
        const text = `Estimado/a ${user.name},

Su solicitud de cuenta como docente no ha sido aprobada.

Motivo: ${notas || 'No especificado'}

Para más información, comuníquese con la administración.

Atentamente,
Instituto Técnico Industrial`
        emailTpl = {
          subject,
          text,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#1A237E;color:#fff;padding:20px;border-radius:8px 8px 0 0;">
              <h2 style="margin:0;font-size:18px;">Instituto Técnico Industrial</h2>
            </div>
            <div style="border:1px solid #e5e7eb;padding:24px;background:#fff;border-radius:0 0 8px 8px;">
              ${text.split('\n').map(l => l.trim() ? `<p style="margin:0 0 10px;line-height:1.6;">${l}</p>` : '<br/>').join('')}
            </div>
          </div>`,
          plantillaTipo: 'DOCENTE_RECHAZADO',
        }
        break
      }
      case 'bloquear':
        newStatus = UserStatus.BLOQUEADO
        break
      case 'activar':
        newStatus = UserStatus.ACTIVO
        break
      case 'restablecer_password': {
        // Generar token de activación (reaprovechamos el mismo flujo)
        // en lugar de mandar contraseña en plaintext por correo.
        const activationToken = crypto.randomBytes(32).toString('hex')
        const activationExpires = new Date(Date.now() + 48 * 60 * 60 * 1000)
        extraData = {
          activationToken,
          activationExpires,
          // Limpiar la contraseña vieja para que nadie pueda usarla
          password: null,
        }
        const subject = 'Restablecer Contraseña - Instituto Técnico Industrial'
        const baseUrl = process.env.NEXT_PUBLIC_URL || ''
        const enlace = `${baseUrl}/#/activar-cuenta?token=${activationToken}`
        const text = `Estimado/a ${user.name},

Su contraseña ha sido restablecida por el administrador.

Para crear una nueva contraseña, utilice el siguiente enlace:

${enlace}

Este enlace expirará en 48 horas.

Atentamente,
Administración - Instituto Técnico Industrial`
        emailTpl = {
          subject,
          text,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#1A237E;color:#fff;padding:20px;border-radius:8px 8px 0 0;">
              <h2 style="margin:0;font-size:18px;">Instituto Técnico Industrial</h2>
              <p style="margin:4px 0 0;font-size:12px;opacity:0.85;">Restablecer contraseña</p>
            </div>
            <div style="border:1px solid #e5e7eb;padding:24px;background:#fff;border-radius:0 0 8px 8px;">
              ${text.split(enlace)[0].split('\n').map((l: string) => l.trim() ? `<p style="margin:0 0 10px;line-height:1.6;">${l}</p>` : '<br/>').join('')}
              <p style="margin:16px 0;text-align:center;">
                <a href="${enlace}" style="display:inline-block;background:#FFD700;color:#1A237E;font-weight:bold;padding:12px 28px;border-radius:6px;text-decoration:none;">Crear nueva contraseña</a>
              </p>
              <p style="font-size:12px;color:#6b7280;word-break:break-all;">Si el botón no funciona, copia y pega este enlace en tu navegador:<br/>${enlace}</p>
            </div>
          </div>`,
          plantillaTipo: 'RESTABLECER_CONTRASENA',
        }
        break
      }
      case 'reenviar_activacion': {
        // Volver a generar token y reenviar correo de activación.
        // Sirve si el usuario perdió el correo original o el token expiró.
        const activationToken = crypto.randomBytes(32).toString('hex')
        const activationExpires = new Date(Date.now() + 48 * 60 * 60 * 1000)
        extraData = { activationToken, activationExpires }
        // Mantener el estado ACEPTADO; el usuario debe activar con el nuevo enlace
        newStatus = UserStatus.ACEPTADO

        if (user.role === UserRole.DOCENTE) {
          emailTpl = tplDocenteAprobado({
            nombre: user.name,
            email: user.email,
            activationToken,
          })
        } else {
          // Para estudiantes, usar la plantilla de inscripción confirmada
          emailTpl = tplInscripcionConfirmada({
            estudianteNombre: user.name,
            estudianteEmail: user.email,
            estudianteCodigo: user.codigo || '',
            activationToken,
          })
        }
        break
      }
      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: { status: newStatus, ...extraData },
    })

    // Enviar correo real vía SMTP (y registrar en BD)
    if (emailTpl) {
      await sendEmail({
        to: user.email,
        toName: user.name,
        subject: emailTpl.subject,
        text: emailTpl.text,
        html: emailTpl.html,
        plantillaTipo: emailTpl.plantillaTipo,
      })
    }

    // Log
    await db.auditLog.create({
      data: {
        userId: session.userId,
        accion: `USUARIO_${action.toUpperCase()}`,
        modulo: 'USUARIOS',
        descripcion: `Usuario ${user.name} (${user.email}) - acción: ${action}`,
        metadata: JSON.stringify({ targetUserId: userId, action, newStatus }),
      },
    })

    return NextResponse.json({ ok: true, user: updated })
  } catch (e) {
    console.error('[admin/usuarios PATCH] Error:', e)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
