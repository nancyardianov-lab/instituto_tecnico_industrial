'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ClipboardList, Plus, Clock, Eye, Trash2, CheckCircle2, Upload, X, FileText, ImageIcon, Video, Paperclip } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function DocenteTareas() {
  const { toast } = useToast()
  const [tareas, setTareas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [cursos, setCursos] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [tareaSel, setTareaSel] = useState<any>(null)
  const [enviando, setEnviando] = useState(false)
  const [form, setForm] = useState({
    titulo: '', descripcion: '', cursoId: '', fechaEntrega: '', punteoMaximo: '100',
  })
  const [archivo, setArchivo] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const cargar = () => {
    fetch('/api/docente/tareas').then(r => r.json()).then(d => {
      setTareas(d.tareas || [])
      setLoading(false)
    })
    fetch('/api/docente/cursos').then(r => r.json()).then(d => setCursos(d.cursos || []))
  }

  useEffect(() => { cargar() }, [])

  const crear = async () => {
    if (!form.titulo || !form.cursoId || !form.fechaEntrega) {
      toast({ title: 'Error', description: 'Complete los campos obligatorios', variant: 'destructive' })
      return
    }
    setEnviando(true)
    try {
      // Usar multipart/form-data SIEMPRE (así el archivo es opcional)
      const fd = new FormData()
      fd.append('titulo', form.titulo)
      fd.append('descripcion', form.descripcion)
      fd.append('cursoId', form.cursoId)
      fd.append('fechaEntrega', form.fechaEntrega)
      fd.append('punteoMaximo', form.punteoMaximo)
      if (archivo) fd.append('archivo', archivo)

      const res = await fetch('/api/docente/tareas', {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (data.ok) {
        toast({ title: 'Tarea creada', description: 'Se notificó a los estudiantes inscritos.' })
        setOpen(false)
        setForm({ titulo: '', descripcion: '', cursoId: '', fechaEntrega: '', punteoMaximo: '100' })
        setArchivo(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        cargar()
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Error inesperado', variant: 'destructive' })
    } finally {
      setEnviando(false)
    }
  }

  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar esta tarea?')) return
    const res = await fetch(`/api/docente/tareas/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.ok) {
      toast({ title: 'Tarea eliminada' })
      cargar()
    }
  }

  const calificar = async (entregaId: string, calificacion: number, comentario: string) => {
    const res = await fetch(`/api/docente/entregas/${entregaId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ calificacion, comentarioDocente: comentario }),
    })
    const data = await res.json()
    if (data.ok) {
      toast({ title: 'Entrega calificada' })
      // Recargar detalle
      const r = await fetch(`/api/docente/tareas/${tareaSel.id}`)
      const d = await r.json()
      setTareaSel(d.tarea)
    }
  }

  if (loading) return <p className="text-muted-foreground">Cargando tareas...</p>

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Tareas</h1>
          <p className="text-muted-foreground text-sm">Gestión de tareas asignadas a sus cursos.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" /> Nueva Tarea
        </Button>
      </div>

      {tareas.length === 0 ? (
        <Card className="iti-card">
          <CardContent className="p-8 text-center text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>No hay tareas creadas. Cree su primera tarea.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {tareas.map((t) => {
            const pendientes = t._count?.entregas || 0
            return (
              <Card key={t.id} className="iti-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm line-clamp-1">{t.titulo}</h3>
                      <div className="text-xs text-muted-foreground mt-0.5">{t.curso.nombre}</div>
                    </div>
                    <Badge variant="outline" className="text-[10px] flex-shrink-0">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(t.fechaEntrega).toLocaleDateString('es-GT')}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{t.descripcion}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">{pendientes} entregas</Badge>
                      <Badge variant="outline" className="text-[10px]">Punteo: {t.punteoMaximo}</Badge>
                      {t.archivoUrl && (
                        <Badge variant="outline" className="text-[10px] flex items-center gap-1 text-primary">
                          <Paperclip className="h-3 w-3" /> Adjunto
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setTareaSel(t)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => eliminar(t.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal crear */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" /> Crear Nueva Tarea
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Curso *</Label>
              <Select value={form.cursoId} onValueChange={(v) => setForm({ ...form, cursoId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccione curso" /></SelectTrigger>
                <SelectContent>
                  {cursos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Título *</Label>
              <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea rows={4} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha de entrega *</Label>
                <Input type="datetime-local" value={form.fechaEntrega} onChange={(e) => setForm({ ...form, fechaEntrega: e.target.value })} />
              </div>
              <div>
                <Label>Punteo máximo</Label>
                <Input type="number" value={form.punteoMaximo} onChange={(e) => setForm({ ...form, punteoMaximo: e.target.value })} />
              </div>
            </div>

            {/* Subida de archivo de apoyo (opcional) */}
            <div>
              <Label>Archivo de apoyo (opcional)</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Puede subir una foto, video o documento desde su dispositivo para apoyar la tarea.
                Máximo 5MB.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                className="hidden"
              />
              {!archivo ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Seleccionar foto, video o documento
                </Button>
              ) : (
                <div className="flex items-center justify-between gap-2 p-3 rounded-md border bg-muted/30">
                  <div className="flex items-center gap-2 min-w-0">
                    {archivo.type.startsWith('image/') ? (
                      <ImageIcon className="h-5 w-5 text-primary flex-shrink-0" />
                    ) : archivo.type.startsWith('video/') ? (
                      <Video className="h-5 w-5 text-primary flex-shrink-0" />
                    ) : (
                      <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{archivo.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {(archivo.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setArchivo(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <Button onClick={crear} disabled={enviando} className="w-full bg-primary hover:bg-primary/90">
              {enviando ? 'Creando...' : 'Crear tarea'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal detalle/entregas */}
      <Dialog open={!!tareaSel} onOpenChange={(o) => !o && setTareaSel(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {tareaSel && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" /> {tareaSel.titulo}
                </DialogTitle>
                <div className="text-sm text-muted-foreground">
                  {tareaSel.curso?.nombre || ''} · Punteo: {tareaSel.punteoMaximo} ·
                  Entrega: {new Date(tareaSel.fechaEntrega).toLocaleString('es-GT')}
                </div>
              </DialogHeader>
              <div className="space-y-3">
                <div className="bg-muted/30 rounded-md p-3 text-sm whitespace-pre-wrap">
                  {tareaSel.descripcion}
                </div>

                {/* Archivo de apoyo del docente */}
                {tareaSel.archivoUrl && (
                  <ArchivoAdjuntoCard
                    url={tareaSel.archivoUrl}
                    nombre={tareaSel.archivoNombre || 'archivo'}
                    tipo={tareaSel.archivoTipo}
                  />
                )}

                <div className="border-t pt-3">
                  <h4 className="font-medium text-sm mb-2">Entregas de estudiantes</h4>
                  {tareaSel.entregas?.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Aún no hay entregas.</p>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {tareaSel.entregas?.map((e: any) => (
                        <EntregaCard key={e.id} entrega={e} punteoMaximo={tareaSel.punteoMaximo} onCalificar={calificar} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Componente para mostrar un archivo adjunto (imagen, video o documento)
function ArchivoAdjuntoCard({ url, nombre, tipo }: { url: string; nombre: string; tipo?: string | null }) {
  const isImage = tipo === 'imagen' || (!tipo && /\.(jpg|jpeg|png|webp|gif)$/i.test(url))
  const isVideo = tipo === 'video' || (!tipo && /\.(mp4|webm|mov|avi)$/i.test(url))

  return (
    <div className="border rounded-md p-3 bg-muted/20">
      <div className="text-xs font-medium text-primary mb-2 flex items-center gap-1">
        <Paperclip className="h-3 w-3" /> Archivo de apoyo:
      </div>
      {isImage && (
        <img
          src={url}
          alt={nombre}
          className="max-h-64 rounded-md mx-auto"
        />
      )}
      {isVideo && (
        <video controls className="w-full max-h-64 rounded-md">
          <source src={url} />
          Tu navegador no soporta el reproductor de video.
        </video>
      )}
      {!isImage && !isVideo && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-2 rounded border bg-background hover:bg-muted/40"
        >
          <FileText className="h-5 w-5 text-primary" />
          <span className="text-sm underline">{nombre}</span>
        </a>
      )}
      {(isImage || isVideo) && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline block mt-1 text-center"
        >
          Ver/Descargar: {nombre}
        </a>
      )}
    </div>
  )
}

function EntregaCard({ entrega, punteoMaximo, onCalificar }: any) {
  const [calificacion, setCalificacion] = useState(entrega.calificacion?.toString() || '')
  const [comentario, setComentario] = useState(entrega.comentarioDocente || '')
  const calificada = entrega.calificacion !== null && entrega.calificacion !== undefined

  return (
    <div className="border rounded-md p-3 bg-muted/20">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-medium text-sm">{entrega.estudiante.user.name}</div>
          <div className="text-xs text-muted-foreground">
            Entregado: {new Date(entrega.fechaEntrega).toLocaleString('es-GT')}
          </div>
        </div>
        {calificada && (
          <Badge className="bg-green-500/15 text-green-700 border-green-500/30">
            <CheckCircle2 className="h-3 w-3 mr-1" /> {entrega.calificacion}/{punteoMaximo}
          </Badge>
        )}
      </div>
      {entrega.comentario && (
        <div className="bg-background rounded p-2 mb-2">
          <div className="text-xs font-medium text-primary mb-1">Comentario del estudiante:</div>
          <p className="text-xs">{entrega.comentario}</p>
        </div>
      )}
      {entrega.archivoUrl && (
        <ArchivoAdjuntoCard
          url={entrega.archivoUrl}
          nombre={entrega.archivoNombre || 'archivo-entregado'}
          tipo={entrega.archivoTipo}
        />
      )}
      <div className="grid grid-cols-3 gap-2 items-end mt-2">
        <div className="col-span-1">
          <Label className="text-xs">Calificación</Label>
          <Input
            type="number"
            min="0"
            max={punteoMaximo}
            value={calificacion}
            onChange={(e) => setCalificacion(e.target.value)}
            placeholder="0-100"
          />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Retroalimentación</Label>
          <Input value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Comentario para el estudiante" />
        </div>
      </div>
      <Button
        size="sm"
        className="mt-2 w-full"
        onClick={() => onCalificar(entrega.id, parseFloat(calificacion) || 0, comentario)}
        disabled={!calificacion}
      >
        {calificada ? 'Actualizar calificación' : 'Calificar entrega'}
      </Button>
    </div>
  )
}
