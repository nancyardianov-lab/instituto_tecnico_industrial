'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Plus, Edit, Trash2, FileText, Calendar, Image, HelpCircle, Save } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function AdminContenido() {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold mb-2">Gestión de Contenido</h1>
        <p className="text-muted-foreground text-sm">Noticias, eventos, galería y preguntas frecuentes.</p>
      </div>
      <Tabs defaultValue="noticias">
        <TabsList>
          <TabsTrigger value="noticias">Noticias</TabsTrigger>
          <TabsTrigger value="eventos">Eventos</TabsTrigger>
          <TabsTrigger value="galeria">Galería</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>
        <TabsContent value="noticias"><NoticiasTab /></TabsContent>
        <TabsContent value="eventos"><EventosTab /></TabsContent>
        <TabsContent value="galeria"><GaleriaTab /></TabsContent>
        <TabsContent value="faq"><FaqTab /></TabsContent>
      </Tabs>
    </div>
  )
}

function NoticiasTab() {
  const { toast } = useToast()
  const [items, setItems] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState<any>(null)
  const [form, setForm] = useState({ titulo: '', resumen: '', contenido: '', imagen: '', destacada: false })

  const cargar = async () => {
    const res = await fetch('/api/admin/noticias')
    const d = await res.json()
    setItems(d.noticias || [])
  }
  useEffect(() => { cargar() }, [])

  const abrirNuevo = () => {
    setEdit(null)
    setForm({ titulo: '', resumen: '', contenido: '', imagen: '', destacada: false })
    setOpen(true)
  }

  const abrirEditar = (n: any) => {
    setEdit(n)
    setForm({ titulo: n.titulo, resumen: n.resumen, contenido: n.contenido, imagen: n.imagen || '', destacada: n.destacada })
    setOpen(true)
  }

  const guardar = async () => {
    if (!form.titulo || !form.resumen || !form.contenido) {
      toast({ title: 'Error', description: 'Título, resumen y contenido son obligatorios', variant: 'destructive' })
      return
    }
    const url = edit ? `/api/admin/noticias/${edit.id}` : '/api/admin/noticias'
    const method = edit ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.ok) {
      toast({ title: edit ? 'Noticia actualizada' : 'Noticia creada' })
      setOpen(false)
      setEdit(null)
      cargar()
    } else {
      toast({ title: 'Error', description: data.error || 'No se pudo guardar', variant: 'destructive' })
    }
  }

  const eliminar = async (id: string, titulo: string) => {
    if (!confirm(`¿Eliminar la noticia "${titulo}"? Esta acción no se puede deshacer.`)) return
    const res = await fetch(`/api/admin/noticias/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.ok) {
      toast({ title: 'Noticia eliminada' })
      cargar()
    } else {
      toast({ title: 'Error', description: data.error || 'No se pudo eliminar', variant: 'destructive' })
    }
  }

  return (
    <Card className="iti-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Noticias ({items.length})</CardTitle>
          <Button size="sm" onClick={abrirNuevo}><Plus className="h-4 w-4 mr-1" /> Nueva</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 && (
          <p className="text-center py-6 text-sm text-muted-foreground">No hay noticias. Crea la primera con el botón "Nueva".</p>
        )}
        {items.map((n) => (
          <div key={n.id} className="flex items-center gap-3 p-3 border rounded-md">
            {n.imagen && <img src={n.imagen} alt="" className="h-12 w-12 rounded object-cover" />}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm line-clamp-1">{n.titulo}</div>
              <div className="text-xs text-muted-foreground line-clamp-1">{n.resumen}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{new Date(n.fechaPublicacion).toLocaleDateString('es-GT')}</div>
            </div>
            {n.destacada && <Badge className="bg-accent/15 text-accent-foreground">Destacada</Badge>}
            <Button size="sm" variant="ghost" onClick={() => abrirEditar(n)} title="Editar"><Edit className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" onClick={() => eliminar(n.id, n.titulo)} title="Eliminar"><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ))}
      </CardContent>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{edit ? 'Editar Noticia' : 'Nueva Noticia'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Título *</Label>
              <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            </div>
            <div>
              <Label>Resumen *</Label>
              <Input value={form.resumen} onChange={(e) => setForm({ ...form, resumen: e.target.value })} />
            </div>
            <div>
              <Label>Contenido *</Label>
              <Textarea rows={6} value={form.contenido} onChange={(e) => setForm({ ...form, contenido: e.target.value })} />
            </div>
            <div>
              <Label>Imagen (URL)</Label>
              <Input value={form.imagen} onChange={(e) => setForm({ ...form, imagen: e.target.value })} placeholder="https://..." />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.destacada} onCheckedChange={(c) => setForm({ ...form, destacada: c })} />
              <Label>Destacada</Label>
            </div>
            <Button onClick={guardar} className="w-full bg-primary hover:bg-primary/90">
              <Save className="h-4 w-4 mr-2" /> {edit ? 'Actualizar' : 'Publicar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function EventosTab() {
  const { toast } = useToast()
  const [items, setItems] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ titulo: '', descripcion: '', fecha: '', hora: '', lugar: '', imagen: '' })

  const cargar = async () => {
    const res = await fetch('/api/admin/eventos')
    const d = await res.json()
    setItems(d.eventos || [])
  }
  useEffect(() => { cargar() }, [])

  const guardar = async () => {
    if (!form.titulo || !form.descripcion || !form.fecha || !form.hora || !form.lugar) {
      toast({ title: 'Error', description: 'Todos los campos son obligatorios', variant: 'destructive' })
      return
    }
    const res = await fetch('/api/admin/eventos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.ok) {
      toast({ title: 'Evento creado' })
      setOpen(false)
      setForm({ titulo: '', descripcion: '', fecha: '', hora: '', lugar: '', imagen: '' })
      cargar()
    } else {
      toast({ title: 'Error', description: data.error || 'No se pudo crear', variant: 'destructive' })
    }
  }

  const eliminar = async (id: string, titulo: string) => {
    if (!confirm(`¿Eliminar el evento "${titulo}"?`)) return
    const res = await fetch(`/api/admin/eventos/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.ok) {
      toast({ title: 'Evento eliminado' })
      cargar()
    } else {
      toast({ title: 'Error', description: data.error || 'No se pudo eliminar', variant: 'destructive' })
    }
  }

  return (
    <Card className="iti-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Eventos ({items.length})</CardTitle>
          <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Nuevo</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 && (
          <p className="text-center py-6 text-sm text-muted-foreground">No hay eventos.</p>
        )}
        {items.map((e) => (
          <div key={e.id} className="flex items-center gap-3 p-3 border rounded-md">
            <div className="w-14 h-14 rounded-md bg-primary/10 flex flex-col items-center justify-center text-primary flex-shrink-0">
              <div className="text-lg font-bold">{new Date(e.fecha).getDate()}</div>
              <div className="text-[10px]">{new Date(e.fecha).toLocaleDateString('es-GT', { month: 'short' })}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{e.titulo}</div>
              <div className="text-xs text-muted-foreground line-clamp-1">{e.descripcion}</div>
              <div className="text-xs text-muted-foreground">{e.hora} · {e.lugar}</div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => eliminar(e.id, e.titulo)} title="Eliminar">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </CardContent>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Nuevo Evento</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Título *</Label>
              <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            </div>
            <div>
              <Label>Descripción *</Label>
              <Textarea rows={3} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha *</Label>
                <Input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
              </div>
              <div>
                <Label>Hora *</Label>
                <Input type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Lugar *</Label>
              <Input value={form.lugar} onChange={(e) => setForm({ ...form, lugar: e.target.value })} />
            </div>
            <div>
              <Label>Imagen (URL, opcional)</Label>
              <Input value={form.imagen} onChange={(e) => setForm({ ...form, imagen: e.target.value })} placeholder="https://..." />
            </div>
            <Button onClick={guardar} className="w-full bg-primary hover:bg-primary/90">
              <Save className="h-4 w-4 mr-2" /> Crear evento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function GaleriaTab() {
  const { toast } = useToast()
  const [items, setItems] = useState<any[]>([])
  const [form, setForm] = useState({ titulo: '', descripcion: '', url: '', categoria: 'instalaciones' })

  const cargar = () => {
    fetch('/api/galeria').then(r => r.json()).then(d => setItems(d.fotos || []))
  }
  useEffect(() => { cargar() }, [])

  return (
    <Card className="iti-card">
      <CardHeader>
        <CardTitle className="text-base">Galería ({items.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          {items.map((g) => (
            <div key={g.id} className="aspect-square rounded-md overflow-hidden iti-card relative group">
              <img src={g.url} alt={g.titulo} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-end p-2">
                <div className="text-white text-xs">{g.titulo}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function FaqTab() {
  const { toast } = useToast()
  const [items, setItems] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ pregunta: '', respuesta: '' })

  const cargar = () => {
    fetch('/api/faq').then(r => r.json()).then(d => setItems(d.faqs || []))
  }
  useEffect(() => { cargar() }, [])

  const guardar = async () => {
    if (!form.pregunta || !form.respuesta) {
      toast({ title: 'Error', description: 'Pregunta y respuesta son obligatorias', variant: 'destructive' })
      return
    }
    const res = await fetch('/api/admin/faq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.ok) {
      toast({ title: 'FAQ creada' })
      setOpen(false)
      setForm({ pregunta: '', respuesta: '' })
      cargar()
    } else {
      toast({ title: 'Error', description: data.error || 'No se pudo crear', variant: 'destructive' })
    }
  }

  const eliminar = async (id: string, pregunta: string) => {
    if (!confirm(`¿Eliminar esta pregunta frecuente?\n\n"${pregunta}"`)) return
    const res = await fetch(`/api/admin/faq/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.ok) {
      toast({ title: 'FAQ eliminada' })
      cargar()
    } else {
      toast({ title: 'Error', description: data.error || 'No se pudo eliminar', variant: 'destructive' })
    }
  }

  return (
    <Card className="iti-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Preguntas Frecuentes ({items.length})</CardTitle>
          <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Nueva</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 && (
          <p className="text-center py-6 text-sm text-muted-foreground">No hay preguntas frecuentes.</p>
        )}
        {items.map((f) => (
          <div key={f.id} className="p-3 border rounded-md flex items-start gap-3">
            <div className="flex-1">
              <div className="font-medium text-sm">{f.pregunta}</div>
              <div className="text-xs text-muted-foreground mt-1">{f.respuesta}</div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => eliminar(f.id, f.pregunta)} title="Eliminar">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </CardContent>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva Pregunta Frecuente</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Pregunta *</Label>
              <Input value={form.pregunta} onChange={(e) => setForm({ ...form, pregunta: e.target.value })} />
            </div>
            <div>
              <Label>Respuesta *</Label>
              <Textarea rows={4} value={form.respuesta} onChange={(e) => setForm({ ...form, respuesta: e.target.value })} />
            </div>
            <Button onClick={guardar} className="w-full bg-primary hover:bg-primary/90">
              <Save className="h-4 w-4 mr-2" /> Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
