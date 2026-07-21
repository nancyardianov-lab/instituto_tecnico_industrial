import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const carrera = await db.carrera.findUnique({
    where: { slug },
    include: {
      cursos: {
        where: { activo: true },
        orderBy: { anio: 'asc' },
      },
      _count: { select: { estudiantes: true } },
    },
  })
  if (!carrera) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  return NextResponse.json({ carrera })
}
