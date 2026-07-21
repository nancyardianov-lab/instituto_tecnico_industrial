import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const [noticias, eventos] = await Promise.all([
    db.noticia.findMany({
      where: { publicada: true },
      orderBy: { fechaPublicacion: 'desc' },
      take: 10,
    }),
    db.evento.findMany({
      where: { fecha: { gte: new Date() } },
      orderBy: { fecha: 'asc' },
      take: 5,
    }),
  ])
  return NextResponse.json({ noticias, eventos })
}
