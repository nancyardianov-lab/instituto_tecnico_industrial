import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { actual, nueva } = await req.json()
    if (!actual || !nueva) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    if (nueva.length < 6) {
      return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: session.userId } })
    if (!user || !user.password) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const valid = await bcrypt.compare(actual, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 400 })
    }

    const hash = await bcrypt.hash(nueva, 10)
    await db.user.update({
      where: { id: user.id },
      data: { password: hash },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[cambiar-password] Error:', e)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
