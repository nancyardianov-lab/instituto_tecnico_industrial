import { NextRequest, NextResponse } from 'next/server'
import { getStore } from '@netlify/blobs'

// Sirve archivos almacenados en Netlify Blobs
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tipo: string; nombre: string }> },
) {
  const { tipo, nombre } = await params

  if (tipo !== 'archivos' && tipo !== 'portadas') {
    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
  }

  try {
    const store = getStore(`biblioteca-${tipo}`)
    const data = await store.get(nombre, { type: 'bytes' })

    if (!data) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }

    // Determinar content-type por extensión
    const ext = nombre.split('.').pop()?.toLowerCase() || ''
    const contentTypes: Record<string, string> = {
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      doc: 'application/msword',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      xls: 'application/vnd.ms-excel',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      ppt: 'application/vnd.ms-powerpoint',
      txt: 'text/plain',
      epub: 'application/epub+zip',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
    }
    const contentType = contentTypes[ext] || 'application/octet-stream'

    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (e: any) {
    console.error('[blob GET] error:', e?.message || e)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
