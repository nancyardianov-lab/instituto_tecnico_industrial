'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Search, Book, Plus, Trash2, Edit, Star, Heart, MessageCircle, Upload, FileText, Image as ImageIcon, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/lib/store'
import { EstudianteBiblioteca } from '../estudiante/estudiante-biblioteca'

export function DocenteBiblioteca() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [tab, setTab] = useState<'listar' | 'gestionar'>('listar')

  if (tab === 'listar') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Biblioteca</h1>
          <Button onClick={() => setTab('gestionar')} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" /> Gestionar libros
          </Button>
        </div>
        <EstudianteBiblioteca />
      </div>
    )
  }

  return <GestionBiblioteca onBack={() => setTab('listar')} />
}

function GestionBiblioteca({ onBack }: { onBack: () => void }) {
  const { toast } = useToast()
  const [libros, setLibros] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [form, setForm] = useState({
    titulo: '', autor: '', descripcion: '', categoria: 'GENERAL', paginas: '', idioma: 'Español',
  })
  const [archivoFile, setArchivoFile] = useState<File | null>(null)
  const [portadaFile, setPortadaFile] = useState<File | null>(null)
  const [archivoUrl, setArchivoUrl] = useState('') // URL opcional si no se sube archivo
  const [portadaUrl, setPortadaUrl] = useState('') // URL opcional si no se sube portada
  const archivoInputRef = useRef<HTMLInputElement>(null)
  const portadaInputRef = useRef<HTMLInputElement>(null)

  const cargar = () => {
    fetch('/api/biblioteca').then(r => r.json()).then(d => setLibros(d.libros || []))
  }
  useEffect(() => { cargar() }, [])

  const reset = () => {
    setForm({ titulo: '', autor: '', descripcion: '', categoria: 'GENERAL', paginas: '', idioma: 'Español' })
    setArchivoFile(null)
    setPortadaFile(null)
    setArchivoUrl('')
    setPortadaUrl('')
    if (archivoInputRef.current) archivoInputRef.current.value = ''
    if (portadaInputRef.current) portadaInputRef.current.value = ''
  }

  const crear = async () => {
    if (!form.titulo || !form.autor) {
      toast({ title: 'Error', description: 'Título y autor son obligatorios', variant: 'destructive' })
      return
    }
    if (!archivoFile && !archivoUrl) {
      toast({ title: 'Archivo requerido', description: 'Sube un archivo o pega una URL del libro', variant: 'destructive' })
      return
    }

    setSubiendo(true)
    try {
      const fd = new FormData()
      fd.append('titulo', form.titulo)
      fd.append('autor', form.autor)
      fd.append('descripcion', form.descripcion)
      fd.append('categoria', form.categoria)
      fd.append('paginas', form.paginas)
      fd.append('idioma', form.idioma)
      if (archivoFile) fd.append('archivo', archivoFile)
      else fd.append('archivoUrl', archivoUrl)
      if (portadaFile) fd.append('portada', portadaFile)
      else if (portadaUrl) fd.append('portadaUrl', portadaUrl)

      const res = await fetch('/api/biblioteca', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.ok) {
        toast({ title: 'Libro agregado', description: 'El libro se subió correctamente a la biblioteca' })
        setOpen(false)
        reset()
        cargar()
      } else {
        toast({ title: 'Error', description: data.error || 'No se pudo subir el libro', variant: 'destructive' })
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Error inesperado', variant: 'destructive' })
    } finally {
      setSubiendo(false)
    }
  }

  const eliminar = async (id: string, titulo: string) => {
    if (!confirm(`¿Eliminar el libro "${titulo}"? Se borrarán también el archivo y la portada del servidor.`)) return
    const res = await fetch(`/api/biblioteca/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.ok) {
      toast({ title: 'Libro eliminado' })
      cargar()
    } else {
      toast({ title: 'Error', description: data.error || 'No se pudo eliminar', variant: 'destructive' })
    }
  }

  const formatearTamano = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestión de Libros</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>Volver</Button>
          <Button onClick={() => setOpen(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" /> Agregar libro
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {libros.map((l) => (
          <Card key={l.id} className="iti-card">
            <CardContent className="p-4">
              <div className="flex items-start gap-3 mb-2">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {l.portada ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.portada} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Book className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm line-clamp-1">{l.titulo}</div>
                  <div className="text-xs text-muted-foreground">{l.autor}</div>
                  <Badge variant="outline" className="text-[10px] mt-1">{l.categoria}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {l._count?.comentarios || 0}</span>
                <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {l._count?.favoritos || 0}</span>
                <span className="flex items-center gap-1">Vistas: {l.vistas}</span>
                <span className="flex items-center gap-1">Descargas: {l.descargas}</span>
              </div>
              <Button size="sm" variant="ghost" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => eliminar(l.id, l.titulo)}>
                <Trash2 className="h-3 w-3 mr-1" /> Eliminar
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset() }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" /> Agregar Nuevo Libro
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Sube el archivo (PDF, Word, Excel, PowerPoint, etc.) directamente desde tu dispositivo.
              Máximo 50 MB por archivo.
            </p>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Título *</Label>
              <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ej: Introducción a la Electricidad" />
            </div>
            <div>
              <Label>Autor *</Label>
              <Input value={form.autor} onChange={(e) => setForm({ ...form, autor: e.target.value })} placeholder="Ej: Juan Pérez" />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea rows={2} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Breve resumen del contenido del libro" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoría</Label>
                <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMPUTACION">Computación</SelectItem>
                    <SelectItem value="DIBUJO">Dibujo</SelectItem>
                    <SelectItem value="COSTURA">Costura</SelectItem>
                    <SelectItem value="ELECTRICIDAD">Electricidad</SelectItem>
                    <SelectItem value="MECANICA">Mecánica</SelectItem>
                    <SelectItem value="ACADEMICA">Académica</SelectItem>
                    <SelectItem value="GENERAL">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Páginas</Label>
                <Input type="number" value={form.paginas} onChange={(e) => setForm({ ...form, paginas: e.target.value })} placeholder="Ej: 120" />
              </div>
            </div>

            {/* Subida de archivo del libro */}
            <div>
              <Label>Archivo del libro * <span className="text-muted-foreground font-normal">(sube desde tu dispositivo)</span></Label>
              <div className="space-y-2">
                <div
                  onClick={() => archivoInputRef.current?.click()}
                  className="border-2 border-dashed border-primary/30 rounded-lg p-4 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <input
                    ref={archivoInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.epub,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,application/epub+zip"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) {
                        if (f.size > 50 * 1024 * 1024) {
                          toast({ title: 'Archivo demasiado grande', description: 'El máximo es 50 MB', variant: 'destructive' })
                          return
                        }
                        setArchivoFile(f)
                      }
                    }}
                  />
                  {archivoFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="h-6 w-6 text-primary" />
                      <div className="text-left">
                        <div className="text-sm font-medium line-clamp-1">{archivoFile.name}</div>
                        <div className="text-xs text-muted-foreground">{formatearTamano(archivoFile.size)}</div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setArchivoFile(null); if (archivoInputRef.current) archivoInputRef.current.value = '' }}
                        className="ml-2 p-1 hover:bg-destructive/10 rounded"
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 py-2">
                      <Upload className="h-8 w-8 text-primary/60" />
                      <div className="text-sm font-medium">Haz clic para seleccionar un archivo</div>
                      <div className="text-xs text-muted-foreground">PDF, Word, Excel, PowerPoint, TXT, EPUB · máx 50 MB</div>
                    </div>
                  )}
                </div>
                <div className="text-center text-xs text-muted-foreground">— o pega una URL si el archivo ya está en internet —</div>
                <Input value={archivoUrl} onChange={(e) => { setArchivoUrl(e.target.value); if (e.target.value && archivoFile) { setArchivoFile(null); if (archivoInputRef.current) archivoInputRef.current.value = '' } }} placeholder="https://..." />
              </div>
            </div>

            {/* Subida de portada */}
            <div>
              <Label>Portada <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <div className="space-y-2">
                <div
                  onClick={() => portadaInputRef.current?.click()}
                  className="border-2 border-dashed border-primary/30 rounded-lg p-4 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <input
                    ref={portadaInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) {
                        if (f.size > 5 * 1024 * 1024) {
                          toast({ title: 'Imagen demasiado grande', description: 'El máximo es 5 MB', variant: 'destructive' })
                          return
                        }
                        setPortadaFile(f)
                      }
                    }}
                  />
                  {portadaFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <ImageIcon className="h-6 w-6 text-primary" />
                      <div className="text-left">
                        <div className="text-sm font-medium line-clamp-1">{portadaFile.name}</div>
                        <div className="text-xs text-muted-foreground">{formatearTamano(portadaFile.size)}</div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setPortadaFile(null); if (portadaInputRef.current) portadaInputRef.current.value = '' }}
                        className="ml-2 p-1 hover:bg-destructive/10 rounded"
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 py-2">
                      <ImageIcon className="h-8 w-8 text-primary/60" />
                      <div className="text-sm font-medium">Haz clic para seleccionar una imagen</div>
                      <div className="text-xs text-muted-foreground">JPG, PNG, WebP, GIF · máx 5 MB</div>
                    </div>
                  )}
                </div>
                <div className="text-center text-xs text-muted-foreground">— o pega una URL de portada —</div>
                <Input value={portadaUrl} onChange={(e) => { setPortadaUrl(e.target.value); if (e.target.value && portadaFile) { setPortadaFile(null); if (portadaInputRef.current) portadaInputRef.current.value = '' } }} placeholder="https://..." />
              </div>
            </div>

            <Button onClick={crear} disabled={subiendo} className="w-full bg-primary hover:bg-primary/90">
              {subiendo ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-pulse" /> Subiendo...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" /> Agregar libro
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
