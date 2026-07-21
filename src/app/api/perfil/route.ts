import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await req.json()
  const { name, telefono, direccion, fechaNacimiento, foto } = body

  const user = await db.user.update({
    where: { id: session.userId },
    data: {
      name,
      telefono,
      direccion,
      fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : undefined,
      foto,
    },
    select: {
      id: true,
      name: true,
      email: true,
      telefono: true,
      direccion: true,
      fechaNacimiento: true,
      foto: true,
    },
  })

  return NextResponse.json({ ok: true, user })
}
