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
import { Plus, Edit, Trash2, FileText, Calendar, Image, HelpCircle } from 'lucide-react'
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
  const [form, setForm] = useState({ titulo: '', resumen: '', contenido: '', imagen: '', destacada: false })

  const cargar = async () => {
    // Reutilizar API pública
    const res = await fetch('/api/noticias')
    const d = await res.json()
    setItems(d.noticias || [])
  }
  useEffect(() => { cargar() }, [])

  const guardar = async () => {
    // Para simplificar: usar endpoint de admin si existe, o crear uno nuevo. Aquí solo mostramos.
    toast({ title: 'Función demo', description: 'Use la API /api/admin/noticias para crear/editar/eliminar noticias.' })
    setOpen(false)
  }

  return (
    <Card className="iti-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Noticias ({items.length})</CardTitle>
          <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Nueva</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((n) => (
          <div key={n.id} className="flex items-center gap-3 p-3 border rounded-md">
            {n.imagen && <img src={n.imagen} className="h-12 w-12 rounded object-cover" />}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm line-clamp-1">{n.titulo}</div>
              <div className="text-xs text-muted-foreground line-clamp-1">{n.resumen}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{new Date(n.fechaPublicacion).toLocaleDateString('es-GT')}</div>
            </div>
            {n.destacada && <Badge className="bg-accent/15 text-accent-foreground">Destacada</Badge>}
            <Button size="sm" variant="ghost"><Edit className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost"><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ))}
      </CardContent>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nueva Noticia</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Título</Label>
              <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            </div>
            <div>
              <Label>Resumen</Label>
              <Input value={form.resumen} onChange={(e) => setForm({ ...form, resumen: e.target.value })} />
            </div>
            <div>
              <Label>Contenido</Label>
              <Textarea rows={6} value={form.contenido} onChange={(e) => setForm({ ...form, contenido: e.target.value })} />
            </div>
            <div>
              <Label>Imagen (URL)</Label>
              <Input value={form.imagen} onChange={(e) => setForm({ ...form, imagen: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.destacada} onCheckedChange={(c) => setForm({ ...form, destacada: c })} />
              <Label>Destacada</Label>
            </div>
            <Button onClick={guardar} className="w-full bg-primary hover:bg-primary/90">Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function EventosTab() {
  const [items, setItems] = useState<any[]>([])
  useEffect(() => {
    fetch('/api/eventos').then(r => r.json()).then(d => setItems(d.eventos || []))
  }, [])
  return (
    <Card className="iti-card">
      <CardHeader>
        <CardTitle className="text-base">Eventos ({items.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((e) => (
          <div key={e.id} className="flex items-center gap-3 p-3 border rounded-md">
            <div className="w-14 h-14 rounded-md bg-primary/10 flex flex-col items-center justify-center text-primary">
              <div className="text-lg font-bold">{new Date(e.fecha).getDate()}</div>
              <div className="text-[10px]">{new Date(e.fecha).toLocaleDateString('es-GT', { month: 'short' })}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{e.titulo}</div>
              <div className="text-xs text-muted-foreground line-clamp-1">{e.descripcion}</div>
              <div className="text-xs text-muted-foreground">{e.hora} · {e.lugar}</div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function GaleriaTab() {
  const [items, setItems] = useState<any[]>([])
  useEffect(() => {
    fetch('/api/galeria').then(r => r.json()).then(d => setItems(d.fotos || []))
  }, [])
  return (
    <Card className="iti-card">
      <CardHeader>
        <CardTitle className="text-base">Galería ({items.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          {items.map((g) => (
            <div key={g.id} className="aspect-square rounded-md overflow-hidden iti-card">
              <img src={g.url} alt={g.titulo} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function FaqTab() {
  const [items, setItems] = useState<any[]>([])
  useEffect(() => {
    fetch('/api/faq').then(r => r.json()).then(d => setItems(d.faqs || []))
  }, [])
  return (
    <Card className="iti-card">
      <CardHeader>
        <CardTitle className="text-base">Preguntas Frecuentes ({items.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((f) => (
          <div key={f.id} className="p-3 border rounded-md">
            <div className="font-medium text-sm">{f.pregunta}</div>
            <div className="text-xs text-muted-foreground mt-1">{f.respuesta}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
