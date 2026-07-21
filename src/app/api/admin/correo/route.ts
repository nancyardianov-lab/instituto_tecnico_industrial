// Admin: verificación y prueba del servicio de correo
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { isEmailConfigured, verifyEmailConnection, sendEmail } from '@/lib/email'

// GET - estado de configuración del correo
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const configured = isEmailConfigured()
  const from = process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER || ''
  const host = process.env.EMAIL_HOST || ''
  const port = process.env.EMAIL_PORT || '465'

  // Últimos 20 correos enviados
  const ultimos = await db.correoEnviado.findMany({
    orderBy: { enviadoAt: 'desc' },
    take: 20,
  })

  return NextResponse.json({
    configurado: configured,
    from,
    host,
    port,
    ultimosCorreos: ultimos,
  })
}

// POST - verificar conexión o enviar correo de prueba
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const accion = body.accion || 'verificar'

  if (accion === 'verificar') {
    const result = await verifyEmailConnection()
    return NextResponse.json(result, { status: result.ok ? 200 : 400 })
  }

  if (accion === 'probar') {
    const destino = (body.destino || '').toString().trim()
    if (!destino) {
      return NextResponse.json({ error: 'Falta destino' }, { status: 400 })
    }

    if (!isEmailConfigured()) {
      return NextResponse.json({
        ok: false,
        error: 'El correo no está configurado. Complete EMAIL_USER, EMAIL_PASSWORD y EMAIL_FROM_ADDRESS en el archivo .env con las credenciales reales del correo institucional y reinicie el servidor.',
      }, { status: 400 })
    }

    const result = await sendEmail({
      to: destino,
      toName: 'Prueba',
      subject: 'Correo de prueba - Instituto Técnico Industrial',
      text: `Este es un correo de prueba enviado desde el sistema del Instituto Técnico Industrial.

Si está leyendo este mensaje, la configuración SMTP funciona correctamente.

Atentamente,
Instituto Técnico Industrial`,
      html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:#1A237E;color:#fff;padding:20px;border-radius:8px 8px 0 0;">
    <h2 style="margin:0;font-size:18px;">Instituto Técnico Industrial</h2>
    <p style="margin:4px 0 0;font-size:12px;opacity:0.85;">Correo de prueba</p>
  </div>
  <div style="border:1px solid #e5e7eb;padding:24px;background:#fff;border-radius:0 0 8px 8px;">
    <p style="margin:0 0 12px;line-height:1.6;">Este es un correo de prueba enviado desde el sistema del Instituto Técnico Industrial.</p>
    <p style="margin:0 0 12px;line-height:1.6;">Si está leyendo este mensaje, la configuración SMTP funciona correctamente.</p>
    <p style="margin:24px 0 0;font-size:12px;color:#6b7280;">Atentamente,<br/>Instituto Técnico Industrial</p>
  </div>
</div>
`,
      plantillaTipo: 'PRUEBA',
    })

    return NextResponse.json(result, { status: result.ok ? 200 : 400 })
  }

  return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
}
