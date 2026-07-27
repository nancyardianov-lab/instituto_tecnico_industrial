import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { Archiver as ArchiverClass } from 'archiver'
import { Readable } from 'stream'
import { readdir, stat, readFile } from 'fs/promises'
import { join } from 'path'

// Forzar runtime Node.js (necesario para fs y archiver)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Endpoint que genera un ZIP con TODO el código fuente del proyecto.
 *
 * Solo accesible para ADMIN. Excluye:
 * - node_modules, .git, .next, build artifacts
 * - .env* (credenciales)
 * - public/uploads (archivos subidos por usuarios)
 * - skills/ (directorio del agente)
 * - db/ (SQLite local)
 * - logs, caches, etc.
 */
export async function GET() {
  // 1. Autorización: solo admin
  const session = await getSession()
  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  // 2. Directorios y archivos a excluir (relativos a la raíz del proyecto)
  const EXCLUDE_DIRS = new Set([
    'node_modules',
    '.git',
    '.next',
    '.vercel',
    'out',
    'build',
    'coverage',
    '.cache',
    'skills',
    'db',
    'public/uploads',
    'scripts/extracted',
    'scripts/career_images',
    'tool-results',
    'upload',
    'download',
    '.zscripts',
    'mini-services',
    'examples',
    '.claude',
    '.z-ai-config',
  ])

  const EXCLUDE_PATTERNS = [
    /\.env($|\.)/,            // .env, .env.local, .env.production, etc.
    /\.DS_Store$/,
    /\.log$/,
    /npm-debug\.log/,
    /yarn-debug\.log/,
    /\.pnp\./,
    /server\.log$/,
    /dev\.log$/,
    /dev\.out\.log$/,
    /local-.*$/,
    /next-env\.d\.ts$/,
    /\.tsbuildinfo$/,
    /\.db(-journal)?$/,
    /\.pem$/,
    /package-lock\.json$/,   // grande, no esencial
    /bun\.lock$/,
  ]

  // Excepciones a los patrones anteriores (archivos que SÍ queremos incluir)
  const INCLUDE_EXCEPTIONS = new Set([
    '.env.example',
  ])

  const PROJECT_ROOT = process.cwd()

  /**
   * Recorre recursivamente el directorio y devuelve una lista de rutas
   * relativas de archivos a incluir en el ZIP.
   */
  async function walk(dir: string, base: string = ''): Promise<string[]> {
    const entries = await readdir(dir, { withFileTypes: true })
    const out: string[] = []

    for (const entry of entries) {
      const relPath = base ? `${base}/${entry.name}` : entry.name

      // Saltar directorios excluidos
      if (entry.isDirectory()) {
        if (EXCLUDE_DIRS.has(relPath)) continue
        const sub = await walk(join(dir, entry.name), relPath)
        out.push(...sub)
        continue
      }

      if (!entry.isFile()) continue

      // Verificar patrones excluidos (con excepciones)
      if (INCLUDE_EXCEPTIONS.has(relPath)) {
        out.push(relPath)
        continue
      }
      if (EXCLUDE_PATTERNS.some((re) => re.test(entry.name))) continue

      out.push(relPath)
    }

    return out
  }

  try {
    // 3. Recolectar archivos
    const files = await walk(PROJECT_ROOT)

    // 4. Crear el ZIP en streaming
    const archive = new ArchiverClass('zip', { zlib: { level: 6 } })

    // 5. Streaming response — pipe directo al response
    const stream = new Readable({
      read() {},
    })

    archive.on('data', (chunk) => stream.push(chunk))
    archive.on('end', () => stream.push(null))
    archive.on('error', (err) => {
      console.error('[descargar-codigo] archiver error:', err)
      stream.destroy(err)
    })

    // 6. Agregar cada archivo al ZIP
    for (const relPath of files) {
      try {
        const abs = join(PROJECT_ROOT, relPath)
        const st = await stat(abs)
        if (st.size > 5 * 1024 * 1024) continue // saltar archivos > 5MB
        const content = await readFile(abs)
        archive.append(content, { name: relPath })
      } catch (e) {
        // si un archivo falla (permisos, etc.) lo saltamos
        console.warn(`[descargar-codigo] skip ${relPath}:`, (e as Error).message)
      }
    }

    archive.finalize()

    // 7. Devolver el stream como ZIP
    const fecha = new Date().toISOString().split('T')[0]
    const filename = `instituto-tecnico-industrial-codigo-${fecha}.zip`

    return new NextResponse(stream as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (e: any) {
    console.error('[descargar-codigo] error:', e)
    return NextResponse.json(
      { error: 'No se pudo generar el ZIP', detalle: e?.message },
      { status: 500 }
    )
  }
}
