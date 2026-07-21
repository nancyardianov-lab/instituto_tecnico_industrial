import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ user: null })
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        foto: true,
        codigo: true,
        telefono: true,
        direccion: true,
        fechaNacimiento: true,
        carreraId: true,
        carrera: { select: { id: true, nombre: true, slug: true } },
        estudiante: {
          include: {
            inscripciones: { include: { curso: true } },
          },
        },
        docente: {
          include: {
            cursos: { include: { curso: true } },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({ user })
  } catch (e) {
    console.error('[auth/me] Error:', e)
    return NextResponse.json({ user: null })
  }
}
