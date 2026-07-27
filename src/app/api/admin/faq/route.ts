import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { UserRole } from '@prisma/client'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  try {
    const body = await req.json()
    const { pregunta, respuesta } = body
    if (!pregunta || !respuesta) {
      return NextResponse.json({ error: 'Pregunta y respuesta son requeridas' }, { status: 400 })
    }
    const faq = await db.faq.create({
      data: { pregunta, respuesta },
    })
    return NextResponse.json({ ok: true, faq })
  } catch (e: any) {
    console.error('[admin/faq POST] Error:', e?.message || e)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
