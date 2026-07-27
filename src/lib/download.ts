/**
 * Fuerza la descarga de un archivo desde una URL (misma o cross-origin).
 *
 * El atributo `download` de <a> NO funciona para URLs cross-origin (Netlify Blobs,
 * Vercel Blob, S3, etc.) — el navegador las abre inline. Para forzar la descarga
 * necesitamos: fetch → blob → objectURL → <a download> → revoke.
 *
 * Si el fetch falla (CORS sin headers adecuados, red caída, etc.) hacemos fallback
 * a `window.open` para no romper la UX.
 */
export async function descargarArchivo(url: string, nombreSugerido?: string): Promise<void> {
  // 1. Intentar fetch + blob (forzar descarga real)
  try {
    const res = await fetch(url, { mode: 'cors', credentials: 'omit' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const blob = await res.blob()

    // Nombre: si el sugerido no tiene extensión, intentar extraerla de la URL
    let nombre = nombreSugerido || 'descarga'
    if (nombre && !/\.[a-zA-Z0-9]{1,5}$/.test(nombre)) {
      const ext = url.split('?')[0].split('#')[0].split('.').pop()
      if (ext && /^[a-zA-Z0-9]{1,5}$/.test(ext)) {
        nombre = `${nombre}.${ext}`
      }
    }

    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = nombre
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    // Liberar memoria después de un momento
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1500)
    return
  } catch (err) {
    console.warn('[descargarArchivo] fetch falló, fallback a window.open:', err)
  }

  // 2. Fallback: abrir en pestaña nueva (el usuario podrá descargar manualmente)
  window.open(url, '_blank', 'noopener,noreferrer')
}

/**
 * Abre el archivo en una pestaña nueva para vista previa (sin forzar descarga).
 */
export function verArchivo(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer')
}
