// API de activación de cuenta
// Recibe: { token, password }
// Marca al usuario como ACTIVO y guarda la contraseña hasheada
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { UserStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }

    // Buscar usuario por token de activación
    const user = await db.user.findUnique({
      where: { activationToken: token },
    })

    if (!user) {
      return NextResponse.json({ error: 'Token inválido o ya utilizado' }, { status: 400 })
    }

    // Verificar expiración
    if (!user.activationExpires || user.activationExpires < new Date()) {
      return NextResponse.json({
        error: 'El enlace ha expirado. Solicite uno nuevo al administrador.',
      }, { status: 400 })
    }

    // Hashear y guardar contraseña, activar cuenta, limpiar token
    const hash = await bcrypt.hash(password, 10)
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hash,
        status: UserStatus.ACTIVO,
        activationToken: null,
        activationExpires: null,
        ultimoAcceso: new Date(),
      },
    })

    // Log de auditoría
    await db.auditLog.create({
      data: {
        userId: user.id,
        accion: 'CUENTA_ACTIVADA',
        modulo: 'AUTH',
        descripcion: `Usuario ${user.email} activó su cuenta`,
        metadata: JSON.stringify({ userId: user.id, role: user.role }),
      },
    })

    return NextResponse.json({
      ok: true,
      message: 'Cuenta activada correctamente',
      email: user.email,
      role: user.role,
    })
  } catch (e: any) {
    console.error('[auth/activar-cuenta] Error:', e?.message || e)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
