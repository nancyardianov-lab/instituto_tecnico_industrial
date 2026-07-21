import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const faqs = await db.faq.findMany({
    where: { activo: true },
    orderBy: { orden: 'asc' },
  })
  return NextResponse.json({ faqs })
}
