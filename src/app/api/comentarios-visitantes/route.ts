import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const comentarios = await db.comentarioVisitante.findMany({
    where: { aprobado: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
  return NextResponse.json({ comentarios })
}

export async function POST(req: NextRequest) {
  try {
    const { nombre, email, comentario, calificacion } = await req.json()
    if (!nombre || !email || !comentario) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }
    
    const c = await db.comentarioVisitante.create({
      data: {
        nombre,
        email,
        comentario,
        calificacion: calificacion || 5,
        aprobado: false, // Pendiente de aprobación
      },
    })
    
    return NextResponse.json({
      ok: true,
      message: 'Gracias por su comentario. Será visible una vez aprobado por el administrador.',
      comentario: c,
    })
  } catch (e) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
