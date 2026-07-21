// Solicitud de cuenta de docente - queda pendiente de aprobación
// El administrador asignará posteriormente: cursos, grados y carreras que impartirá
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { UserRole, UserStatus } from '@prisma/client'
import { sendEmail, tplSolicitudDocente } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, telefono } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Nombre y email son requeridos' }, { status: 400 })
    }

    // Verificar si ya existe
    const existente = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (existente) {
      return NextResponse.json({ error: 'Ya existe una cuenta con este correo' }, { status: 400 })
    }

    // Generar código automático para docente (DOC-YYYY-NNN)
    const year = new Date().getFullYear()
    const count = await db.user.count({ where: { role: UserRole.DOCENTE } })
    const codigo = `DOC-${year}-${String(count + 1).padStart(3, '0')}`

    // Crear usuario pendiente (sin password aún).
    // Los campos especialidad y tituloProfesional se omiten: el administrador
    // los definirá al asignar los cursos, grados y carreras que el docente impartirá.
    const user = await db.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        telefono,
        codigo,
        role: UserRole.DOCENTE,
        status: UserStatus.PENDIENTE,
        docente: {
          create: {},
        },
      },
    })

    // Registrar en log de auditoría
    await db.auditLog.create({
      data: {
        userId: user.id,
        accion: 'SOLICITUD_CUENTA_DOCENTE',
        modulo: 'USUARIOS',
        descripcion: `Solicitud de cuenta docente: ${name} (${email})`,
      },
    })

    // Enviar correo confirmando recepción al docente
    const tpl = tplSolicitudDocente({ nombre: name })
    await sendEmail({
      to: email.toLowerCase().trim(),
      toName: name,
      subject: tpl.subject,
      text: tpl.text,
      html: tpl.html,
      plantillaTipo: tpl.plantillaTipo,
    })

    return NextResponse.json({
      ok: true,
      message: 'Solicitud enviada correctamente. El administrador revisará su solicitud y le enviará un correo con instrucciones para activar su cuenta. Posteriormente, el administrador le asignará los cursos, grados y carreras que impartirá.',
    })
  } catch (e) {
    console.error('[register-docente] Error:', e)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

