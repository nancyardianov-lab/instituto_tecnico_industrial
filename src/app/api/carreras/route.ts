import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const carreras = await db.carrera.findMany({
    where: { activa: true },
    include: {
      cursos: {
        where: { activo: true },
        orderBy: { anio: 'asc' },
      },
      _count: { select: { estudiantes: true } },
    },
    orderBy: { nombre: 'asc' },
  })
  return NextResponse.json({ carreras })
}
