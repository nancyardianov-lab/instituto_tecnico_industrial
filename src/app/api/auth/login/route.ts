// API de autenticación: Login
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { signToken, setSessionCookie } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!user || !user.password) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    if (user.status === 'PENDIENTE') {
      return NextResponse.json({ 
        error: 'Su cuenta está pendiente de aprobación. Espere la revisión del administrador.' 
      }, { status: 403 })
    }
    if (user.status === 'ACEPTADO') {
      // Si tiene token de activación pendiente, avisarle que revise el correo
      if (user.activationToken) {
        return NextResponse.json({
          error: 'Tu cuenta está aprobada pero aún no está activada. Revisa tu correo (incluida la carpeta de spam) y haz clic en el enlace "Activar mi cuenta" para crear tu contraseña. El enlace expira en 48 horas.'
        }, { status: 403 })
      }
      return NextResponse.json({
        error: 'Su preinscripción fue aceptada. Debe presentarse al instituto para completar la inscripción presencial.'
      }, { status: 403 })
    }
    if (user.status === 'BLOQUEADO') {
      return NextResponse.json({ 
        error: 'Su cuenta está bloqueada. Contacte al administrador.' 
      }, { status: 403 })
    }
    if (user.status === 'RECHAZADO') {
      return NextResponse.json({ 
        error: 'Su solicitud fue rechazada. Contacte al administrador para más información.' 
      }, { status: 403 })
    }
    if (user.status === 'DOCUMENTACION_INCOMPLETA') {
      return NextResponse.json({ 
        error: 'Su documentación está incompleta. Contacte al administrador.' 
      }, { status: 403 })
    }
    if (user.status !== 'ACTIVO') {
      return NextResponse.json({ 
        error: 'Su cuenta no está activa.' 
      }, { status: 403 })
    }

    await db.user.update({
      where: { id: user.id },
      data: { ultimoAcceso: new Date() },
    })

    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    })

    await setSessionCookie(token)

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        foto: user.foto,
        codigo: user.codigo,
        telefono: user.telefono,
      },
    })
  } catch (e) {
    console.error('[auth/login] Error:', e)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
