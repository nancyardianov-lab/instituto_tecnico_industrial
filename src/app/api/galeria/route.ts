import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const fotos = await db.fotoGaleria.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ fotos })
}
