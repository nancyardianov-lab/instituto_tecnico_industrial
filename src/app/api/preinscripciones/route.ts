import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { PreinscripcionStatus, UserRole, UserStatus } from '@prisma/client'
import { sendEmail, tplPreinscripcionRecibida } from '@/lib/email'

// GET - listar preinscripciones (solo admin)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  
  const where: any = {}
  if (status && status !== 'TODOS') {
    where.status = status as PreinscripcionStatus
  }
  
  const preinscripciones = await db.preinscripcion.findMany({
    where,
    include: {
      carrera: { select: { nombre: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  
  return NextResponse.json({ preinscripciones })
}

// POST - crear nueva preinscripción
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      padreNombre, padreTelefono, padreEmail,
      estudianteNombre, estudianteCodigo, estudianteTelefono, estudianteEmail,
      carreraId,
    } = body

    // Validación
    if (!padreNombre || !padreTelefono || !padreEmail) {
      return NextResponse.json({ error: 'Datos del padre/encargado incompletos' }, { status: 400 })
    }
    if (!estudianteNombre || !estudianteCodigo || !estudianteTelefono || !estudianteEmail) {
      return NextResponse.json({ error: 'Datos del estudiante incompletos' }, { status: 400 })
    }
    if (!carreraId) {
      return NextResponse.json({ error: 'Debe seleccionar una carrera' }, { status: 400 })
    }

    // Verificar carrera
    const carrera = await db.carrera.findUnique({ where: { id: carreraId } })
    if (!carrera) {
      return NextResponse.json({ error: 'Carrera no encontrada' }, { status: 404 })
    }

    // Verificar código único
    const existe = await db.preinscripcion.findFirst({
      where: { estudianteCodigo, status: { not: PreinscripcionStatus.RECHAZADA } },
    })
    if (existe) {
      return NextResponse.json({ error: 'Ya existe una solicitud con este código de estudiante' }, { status: 400 })
    }

    // Crear preinscripción
    const preinscripcion = await db.preinscripcion.create({
      data: {
        padreNombre, padreTelefono, padreEmail,
        estudianteNombre, estudianteCodigo, estudianteTelefono, estudianteEmail,
        carreraId,
        carreraNombre: carrera.nombre,
        status: PreinscripcionStatus.PENDIENTE,
      },
    })

    // Registrar en log
    await db.auditLog.create({
      data: {
        accion: 'PREINSCRIPCION_CREADA',
        modulo: 'PREINSCRIPCIONES',
        descripcion: `Nueva preinscripción: ${estudianteNombre} - ${carrera.nombre}`,
        metadata: JSON.stringify({ preinscripcionId: preinscripcion.id }),
      },
    })

    // Enviar correo real al estudiante (plantilla "preinscripción recibida")
    const tpl = tplPreinscripcionRecibida({
      estudianteNombre,
      carreraNombre: carrera.nombre,
      estudianteCodigo,
    })
    await sendEmail({
      to: estudianteEmail,
      toName: estudianteNombre,
      subject: tpl.subject,
      text: tpl.text,
      html: tpl.html,
      plantillaTipo: tpl.plantillaTipo,
    })

    // Enviar correo al padre/encargado si es distinto
    if (padreEmail !== estudianteEmail) {
      const tplPadre = tplPreinscripcionRecibida({
        estudianteNombre,
        carreraNombre: carrera.nombre,
        estudianteCodigo,
      })
      await sendEmail({
        to: padreEmail,
        toName: padreNombre,
        subject: tplPadre.subject,
        text: tplPadre.text,
        html: tplPadre.html,
        plantillaTipo: tplPadre.plantillaTipo,
      })
    }

    return NextResponse.json({
      ok: true,
      message: 'Solicitud de preinscripción enviada correctamente. Recibirá un correo confirmando la recepción. Deberá esperar la revisión del administrador.',
      preinscripcion,
    })
  } catch (e) {
    console.error('[preinscripciones] POST Error:', e)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
