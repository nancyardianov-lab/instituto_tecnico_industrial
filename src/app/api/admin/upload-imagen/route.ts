import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { subirArchivo, PORTADAS_PERMITIDAS, MAX_PORTADA } from '@/lib/storage'

// POST - subir una imagen genérica (para carreras, noticias, eventos, etc.)
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('imagen') as File | null

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'No se recibió ninguna imagen' }, { status: 400 })
    }

    if (file.size > MAX_PORTADA) {
      return NextResponse.json({ error: 'La imagen supera el tamaño máximo de 5MB' }, { status: 400 })
    }

    const r = await subirArchivo(file, 'portadas', PORTADAS_PERMITIDAS, MAX_PORTADA)
    if (!r.ok) {
      return NextResponse.json({ error: r.error }, { status: 400 })
    }

    return NextResponse.json({ ok: true, url: r.url })
  } catch (e: any) {
    console.error('[admin/upload-imagen] error:', e?.message || e)
    return NextResponse.json({
      error: 'Error al subir imagen: ' + (e?.message || 'error desconocido'),
    }, { status: 500 })
  }
}
