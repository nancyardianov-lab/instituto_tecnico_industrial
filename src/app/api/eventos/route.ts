import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const eventos = await db.evento.findMany({
    orderBy: { fecha: 'desc' },
    take: 20,
  })
  return NextResponse.json({ eventos })
}
