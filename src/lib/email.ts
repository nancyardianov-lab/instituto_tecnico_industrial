// Servicio de envío de correos del Instituto Técnico Industrial
// Configuración SMTP vía variables de entorno (.env)
//
// Variables requeridas en .env:
//   EMAIL_HOST            -> ej. smtp.gmail.com
//   EMAIL_PORT            -> ej. 465 (SSL) o 587 (STARTTLS)
//   EMAIL_SECURE          -> "true" para puerto 465, "false" para 587
//   EMAIL_USER            -> correo institucional, ej. tecnicoindustrial@gmail.com
//   EMAIL_PASSWORD        -> contraseña de aplicación (NO la contraseña normal)
//   EMAIL_FROM_NAME       -> nombre visible, ej. "Instituto Técnico Industrial"
//   EMAIL_FROM_ADDRESS    -> mismo valor que EMAIL_USER
//   NEXT_PUBLIC_URL       -> URL pública del sitio (para enlaces de activación)
//
// Para Gmail: la "contraseña de aplicación" se genera en
//   https://myaccount.google.com/apppasswords  (requiere verificación en 2 pasos).

import nodemailer from 'nodemailer'
import { db } from '@/lib/db'

let _transporter: nodemailer.Transporter | null = null

function getConfig() {
  return {
    host: process.env.EMAIL_HOST || '',
    port: parseInt(process.env.EMAIL_PORT || '465', 10),
    secure: (process.env.EMAIL_SECURE ?? 'true') === 'true',
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    fromName: process.env.EMAIL_FROM_NAME || 'Instituto Técnico Industrial',
    fromAddress: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER || '',
  }
}

export function isEmailConfigured(): boolean {
  const c = getConfig()
  // Consider "PENDIENTE" / empty as not configured so we don't try to actually
  // connect to Gmail with bogus credentials during setup.
  const valid = (v: string) => !!v && v.trim() !== '' && v.trim().toUpperCase() !== 'PENDIENTE'
  return valid(c.host) && valid(c.user) && valid(c.password) && valid(c.fromAddress)
}

function getTransporter(): nodemailer.Transporter {
  if (_transporter) return _transporter
  const c = getConfig()
  _transporter = nodemailer.createTransport({
    host: c.host,
    port: c.port,
    secure: c.secure,
    auth: { user: c.user, pass: c.password },
  })
  return _transporter
}

export interface SendEmailOptions {
  to: string
  toName?: string
  subject: string
  text: string
  html?: string
  plantillaTipo?: string
}

// Valores válidos del enum PlantillaTipo en Prisma.
// Si pasamos un string fuera de esta lista, Prisma rechaza la operación.
const PLANTILLA_TIPO_VALIDOS = new Set([
  'PREINSCRIPCION_RECIBIDA',
  'PREINSCRIPCION_ACEPTADA',
  'PREINSCRIPCION_RECHAZADA',
  'DOCUMENTACION_INCOMPLETA',
  'INSCRIPCION_CONFIRMADA',
  'ACTIVACION_CUENTA',
  'RESTABLECER_CONTRASENA',
  'TAREA_NUEVA',
  'NOTA_PUBLICADA',
  'DOCENTE_APROBADO',
  'DOCENTE_RECHAZADO',
])

function normalizePlantillaTipo(t?: string): any {
  if (!t) return null
  return PLANTILLA_TIPO_VALIDOS.has(t) ? t : null
}

/**
 * Envía un correo electrónico real vía SMTP y deja constancia en la base
 * de datos (tabla CorreoEnviado). Si el envío falla, también se registra
 * para que el administrador pueda ver el historial completo.
 */
export async function sendEmail(opts: SendEmailOptions): Promise<{ ok: boolean; error?: string; messageId?: string }> {
  const c = getConfig()

  // Si no hay configuración SMTP, registramos el correo en BD pero no se envía.
  // Esto permite que el sistema siga funcionando en desarrollo sin correo real.
  if (!isEmailConfigured()) {
    await db.correoEnviado.create({
      data: {
        destinatario: opts.to,
        destinatarioNombre: opts.toName,
        asunto: opts.subject,
        contenido: opts.text,
        plantillaTipo: normalizePlantillaTipo(opts.plantillaTipo),
      },
    })
    return { ok: false, error: 'EMAIL_NOT_CONFIGURED' }
  }

  try {
    const transporter = getTransporter()
    const info = await transporter.sendMail({
      from: `"${c.fromName}" <${c.fromAddress}>`,
      to: opts.toName ? `"${opts.toName}" <${opts.to}>` : opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    })

    // Registrar en BD para historial
    await db.correoEnviado.create({
      data: {
        destinatario: opts.to,
        destinatarioNombre: opts.toName,
        asunto: opts.subject,
        contenido: opts.text,
        plantillaTipo: normalizePlantillaTipo(opts.plantillaTipo),
      },
    })

    return { ok: true, messageId: info.messageId }
  } catch (e: any) {
    console.error('[email] Error enviando correo:', e?.message || e)
    // Aun si falla el envío, dejamos registro para auditoría
    await db.correoEnviado.create({
      data: {
        destinatario: opts.to,
        destinatarioNombre: opts.toName,
        asunto: `[FALLO] ${opts.subject}`,
        contenido: opts.text,
        plantillaTipo: normalizePlantillaTipo(opts.plantillaTipo),
      },
    })
    return { ok: false, error: e?.message || 'Error desconocido' }
  }
}

/**
 * Verifica la conexión SMTP sin enviar un correo. Útil para que el admin
 * pueda probar la configuración antes de usarla en producción.
 */
export async function verifyEmailConnection(): Promise<{ ok: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    return { ok: false, error: 'Falta configurar EMAIL_HOST / EMAIL_USER / EMAIL_PASSWORD en .env' }
  }
  try {
    const transporter = getTransporter()
    await transporter.verify()
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'No se pudo conectar al servidor SMTP' }
  }
}

// ============================================================
// PLANTILLAS DE CORREO (HTML + texto plano)
// ============================================================

const FOOTER = `
<br/><br/>
<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
<p style="font-size:12px;color:#6b7280;line-height:1.6;">
<strong>Instituto Técnico Industrial</strong><br/>
7A. Avenida 6-07 Zona 2, San Pedro Sacatepéquez, San Marcos<br/>
Tel: 7760-2670 | tecnicoindustrial@gmail.com<br/>
<em>"Solo la calidad nos hace competitivos"</em>
</p>
`

function wrapHtml(title: string, body: string): string {
  return `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#1f2937;">
  <div style="background:#1A237E;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0;">
    <h2 style="margin:0;font-size:18px;">Instituto Técnico Industrial</h2>
    <p style="margin:4px 0 0;font-size:12px;opacity:0.85;">${title}</p>
  </div>
  <div style="border:1px solid #e5e7bed;padding:24px;background:#fff;border-radius:0 0 8px 8px;">
    ${body}
  </div>
  ${FOOTER}
</div>
`
}

function plainToHtml(text: string): string {
  return text
    .split('\n')
    .map(line => line.trim() === '' ? '<br/>' : `<p style="margin:0 0 10px;line-height:1.6;">${line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>`)
    .join('')
}

export interface EmailTemplate {
  subject: string
  text: string
  html: string
  plantillaTipo: string
}

// Plantilla: preinscripción recibida
export function tplPreinscripcionRecibida(p: {
  estudianteNombre: string
  carreraNombre: string
  estudianteCodigo: string
}): EmailTemplate {
  const subject = 'Solicitud de Preinscripción Recibida - Instituto Técnico Industrial'
  const text = `Estimado/a ${p.estudianteNombre},

Hemos recibido correctamente su solicitud de preinscripción para la carrera de ${p.carreraNombre} en el Instituto Técnico Industrial.

Su solicitud será revisada por el equipo administrativo en los próximos días. Una vez revisada, recibirá una notificación por correo electrónico indicando el estado de su solicitud.

Datos registrados:
- Estudiante: ${p.estudianteNombre}
- Carrera: ${p.carreraNombre}
- Código: ${p.estudianteCodigo}

Si necesita realizar alguna corrección o tiene preguntas, puede contactarnos al teléfono 7760-2670 o al correo tecnicoindustrial@gmail.com.

Atentamente,
Instituto Técnico Industrial`
  return {
    subject,
    text,
    html: wrapHtml('Solicitud recibida', plainToHtml(text)),
    plantillaTipo: 'PREINSCRIPCION_RECIBIDA',
  }
}

// Plantilla: preinscripción aceptada (debe presentarse presencialmente)
export function tplPreinscripcionAceptada(p: {
  estudianteNombre: string
  carreraNombre: string
  fechaInscripcion?: string
}): EmailTemplate {
  const subject = '¡Felicidades! Preinscripción Aceptada - Instituto Técnico Industrial'
  const text = `Estimado/a ${p.estudianteNombre},

¡Felicidades! Su solicitud de preinscripción para la carrera de ${p.carreraNombre} ha sido ACEPTADA.

Para completar su inscripción, debe presentarse presencialmente al instituto con la siguiente documentación:

DOCUMENTOS REQUERIDOS:
1. Certificado de estudios de nivel básico
2. Diploma de graduación de nivel básico
3. Fotocopia de cédula de identidad del estudiante
4. Fotocopia de cédula de identidad del padre/encargado
5. Certificado de nacimiento
6. Certificado de salud
7. 2 fotografías tamaño cédula
8. Constancia de no antecedentes penales (mayores de edad)

${p.fechaInscripcion ? `FECHA Y HORA: ${p.fechaInscripcion}\n` : ''}LUGAR: Instituto Técnico Industrial, 7A. Avenida 6-07 Zona 2, San Pedro Sacatepéquez, San Marcos
Oficina de Registro y Control, planta baja.

RECOMENDACIONES:
- Llegar 15 minutos antes de la hora asignada
- Traer originales y copias de todos los documentos
- En caso de no poder asistir, comunicarse al teléfono 7760-2670

Una vez confirmada su inscripción presencial, recibirá un correo con instrucciones para activar su cuenta en el sistema.

Atentamente,
Administración - Instituto Técnico Industrial`
  return {
    subject,
    text,
    html: wrapHtml('Preinscripción aceptada', plainToHtml(text)),
    plantillaTipo: 'PREINSCRIPCION_ACEPTADA',
  }
}

// Plantilla: preinscripción rechazada
export function tplPreinscripcionRechazada(p: {
  estudianteNombre: string
  carreraNombre: string
  notasRevision?: string
}): EmailTemplate {
  const subject = 'Actualización de su Solicitud de Preinscripción'
  const text = `Estimado/a ${p.estudianteNombre},

Le informamos que su solicitud de preinscripción para la carrera de ${p.carreraNombre} ha sido revisada y lamentablemente no ha sido aceptada en esta ocasión.

Motivo: ${p.notasRevision || 'No especificado'}

Si desea presentar una nueva solicitud en el próximo ciclo, le recomendamos revisar los requisitos y volver a aplicar.

Para cualquier consulta, puede comunicarse al teléfono 7760-2670 o al correo tecnicoindustrial@gmail.com.

Atentamente,
Administración - Instituto Técnico Industrial`
  return {
    subject,
    text,
    html: wrapHtml('Actualización de solicitud', plainToHtml(text)),
    plantillaTipo: 'PREINSCRIPCION_RECHAZADA',
  }
}

// Plantilla: inscripción confirmada (con enlace de activación de cuenta)
export function tplInscripcionConfirmada(p: {
  estudianteNombre: string
  estudianteEmail: string
  estudianteCodigo: string
  activationToken: string
}): EmailTemplate {
  const baseUrl = process.env.NEXT_PUBLIC_URL || ''
  const enlaceActivacion = `${baseUrl}/#/activar-cuenta?token=${p.activationToken}`
  const subject = 'Inscripción Confirmada - Active su Cuenta'
  const text = `Estimado/a ${p.estudianteNombre},

¡Bienvenido/a al Instituto Técnico Industrial!

Su inscripción presencial ha sido confirmada. Su cuenta en el sistema académico ha sido habilitada.

Para activar su cuenta y crear su contraseña, utilice el siguiente enlace:

${enlaceActivacion}

Este enlace expirará en 48 horas.

Sus datos de acceso:
- Usuario: ${p.estudianteEmail}
- Código: ${p.estudianteCodigo}

Atentamente,
Administración - Instituto Técnico Industrial`
  return {
    subject,
    text,
    html: wrapHtml('Active su cuenta', `
      ${plainToHtml(text.split(enlaceActivacion)[0])}
      <p style="margin:16px 0;text-align:center;">
        <a href="${enlaceActivacion}" style="display:inline-block;background:#FFD700;color:#1A237E;font-weight:bold;padding:12px 28px;border-radius:6px;text-decoration:none;">Activar mi cuenta</a>
      </p>
      <p style="font-size:12px;color:#6b7280;word-break:break-all;">Si el botón no funciona, copie y pegue este enlace en su navegador:<br/>${enlaceActivacion}</p>
      ${plainToHtml(text.split(enlaceActivacion)[1] || '')}
    `),
    plantillaTipo: 'INSCRIPCION_CONFIRMADA',
  }
}

// Plantilla: solicitud de docente recibida
export function tplSolicitudDocente(p: {
  nombre: string
}): EmailTemplate {
  const subject = 'Solicitud de Cuenta Docente Recibida - Instituto Técnico Industrial'
  const text = `Estimado/a ${p.nombre},

Hemos recibido su solicitud para obtener una cuenta de docente en el sistema del Instituto Técnico Industrial.

Su solicitud será revisada por el equipo administrativo. Una vez aprobada, recibirá un correo con instrucciones para activar su cuenta. Posteriormente, el administrador le asignará los cursos, grados y carreras que impartirá.

Si tiene preguntas, puede comunicarse al teléfono 7760-2670 o al correo tecnicoindustrial@gmail.com.

Atentamente,
Instituto Técnico Industrial`
  return {
    subject,
    text,
    html: wrapHtml('Solicitud docente recibida', plainToHtml(text)),
    // No hay tipo específico en el enum para "solicitud docente recibida"
    // (sí lo hay para aprobación/rechazo). Dejamos null para que se guarde sin plantillaTipo.
    plantillaTipo: '',
  }
}

// Plantilla: docente aprobado (con enlace de activación)
export function tplDocenteAprobado(p: {
  nombre: string
  email: string
  activationToken: string
}): EmailTemplate {
  const baseUrl = process.env.NEXT_PUBLIC_URL || ''
  const enlace = `${baseUrl}/#/activar-cuenta?token=${p.activationToken}`
  const subject = 'Cuenta Docente Aprobada - Active su Cuenta'
  const text = `Estimado/a ${p.nombre},

¡Felicidades! Su solicitud de cuenta de docente en el Instituto Técnico Industrial ha sido aprobada.

Para activar su cuenta y crear su contraseña, utilice el siguiente enlace:

${enlace}

Este enlace expirará en 48 horas.

Sus datos de acceso:
- Usuario: ${p.email}

Una vez que active su cuenta, el administrador le asignará los cursos, grados y carreras que impartirá.

Atentamente,
Administración - Instituto Técnico Industrial`
  return {
    subject,
    text,
    html: wrapHtml('Cuenta docente aprobada', `
      ${plainToHtml(text.split(enlace)[0])}
      <p style="margin:16px 0;text-align:center;">
        <a href="${enlace}" style="display:inline-block;background:#FFD700;color:#1A237E;font-weight:bold;padding:12px 28px;border-radius:6px;text-decoration:none;">Activar mi cuenta</a>
      </p>
      <p style="font-size:12px;color:#6b7280;word-break:break-all;">Si el botón no funciona, copie y pegue este enlace en su navegador:<br/>${enlace}</p>
      ${plainToHtml(text.split(enlace)[1] || '')}
    `),
    plantillaTipo: 'DOCENTE_APROBADO',
  }
}
