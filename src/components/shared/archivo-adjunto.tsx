'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Paperclip, FileText, ImageIcon, Video, Download, Eye, Loader2 } from 'lucide-react'
import { descargarArchivo, verArchivo } from '@/lib/download'

interface Props {
  url: string
  nombre: string
  tipo?: string | null
  /** Etiqueta opcional ("Archivo de apoyo:", "Mi entrega:", etc.) */
  etiqueta?: string
}

/**
 * Componente reutilizable para mostrar un archivo adjunto.
 * - Imágenes: preview + botones Ver/Descargar
 * - Videos: reproductor + botones Ver/Descargar
 * - Documentos: botón Ver + botón Descargar
 *
 * El botón "Descargar" usa descargarArchivo() que fuerza la descarga real
 * incluso para URLs cross-origin (Netlify Blobs / Vercel Blob).
 */
export function ArchivoAdjunto({ url, nombre, tipo, etiqueta = 'Archivo adjunto:' }: Props) {
  const [descargando, setDescargando] = useState(false)

  const isImage = tipo === 'imagen' || (!tipo && /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(url))
  const isVideo = tipo === 'video' || (!tipo && /\.(mp4|webm|mov|avi|mkv)$/i.test(url))

  const handleDescargar = async () => {
    setDescargando(true)
    try {
      await descargarArchivo(url, nombre)
    } finally {
      // Pequeño delay para que el usuario vea feedback antes de resetear
      setTimeout(() => setDescargando(false), 800)
    }
  }

  return (
    <div className="border rounded-md p-3 bg-muted/20">
      <div className="text-xs font-medium text-primary mb-2 flex items-center gap-1">
        <Paperclip className="h-3 w-3" /> {etiqueta}
      </div>

      {/* Preview según tipo */}
      {isImage && (
        <img
          src={url}
          alt={nombre}
          className="max-h-64 rounded-md mx-auto cursor-pointer"
          onClick={() => verArchivo(url)}
        />
      )}
      {isVideo && (
        <video controls className="w-full max-h-64 rounded-md">
          <source src={url} />
          Tu navegador no soporta el reproductor de video.
        </video>
      )}
      {!isImage && !isVideo && (
        <div className="flex items-center gap-2 p-2 rounded border bg-background">
          {tipo === 'imagen' ? (
            <ImageIcon className="h-5 w-5 text-primary flex-shrink-0" />
          ) : tipo === 'video' ? (
            <Video className="h-5 w-5 text-primary flex-shrink-0" />
          ) : (
            <FileText className="h-5 w-5 text-primary flex-shrink-0" />
          )}
          <span className="text-sm truncate flex-1">{nombre}</span>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex gap-2 mt-2 justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={() => verArchivo(url)}
        >
          <Eye className="h-3.5 w-3.5 mr-1" /> Ver
        </Button>
        <Button
          size="sm"
          onClick={handleDescargar}
          disabled={descargando}
          className="bg-primary hover:bg-primary/90"
        >
          {descargando ? (
            <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Descargando...</>
          ) : (
            <><Download className="h-3.5 w-3.5 mr-1" /> Descargar</>
          )}
        </Button>
      </div>
    </div>
  )
}
