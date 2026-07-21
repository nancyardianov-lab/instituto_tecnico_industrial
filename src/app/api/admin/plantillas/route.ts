import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { PlantillaTipo } from '@prisma/client'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  
  const plantillas = await db.plantillaCorreo.findMany({
    orderBy: { tipo: 'asc' },
  })
  return NextResponse.json({ plantillas })
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  
  try {
    const body = await req.json()
    const { tipo, asunto, contenido, firma, documentosSolicitados, informacionContacto, fechaLimite, logoUrl } = body
    
    const plantilla = await db.plantillaCorreo.upsert({
      where: { tipo: tipo as PlantillaTipo },
      update: {
        asunto, contenido, firma, documentosSolicitados, informacionContacto, fechaLimite, logoUrl,
      },
      create: {
        tipo: tipo as PlantillaTipo,
        asunto, contenido, firma, documentosSolicitados, informacionContacto, fechaLimite, logoUrl,
      },
    })
    
    return NextResponse.json({ ok: true, plantilla })
  } catch (e) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
