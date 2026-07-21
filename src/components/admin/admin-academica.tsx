'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, FolderTree, BookOpen, Users, Edit, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function AdminAcademica() {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold mb-2">Gestión Académica</h1>
        <p className="text-muted-foreground text-sm">Administre carreras, cursos y asignaciones.</p>
      </div>
      <Tabs defaultValue="carreras">
        <TabsList>
          <TabsTrigger value="carreras">Carreras</TabsTrigger>
          <TabsTrigger value="cursos">Cursos</TabsTrigger>
        </TabsList>
        <TabsContent value="carreras"><CarrerasTab /></TabsContent>
        <TabsContent value="cursos"><CursosTab /></TabsContent>
      </Tabs>
    </div>
  )
}

function CarrerasTab() {
  const { toast } = useToast()
  const [carreras, setCarreras] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState<any>(null)
  const [form, setForm] = useState({
    nombre: '', slug: '', descripcion: '', objetivo: '', perfilEgresado: '', campoLaboral: '',
    duracion: '3 años', imagen: '', galeria: '[]', activa: true,
  })

  const cargar = () => {
    fetch('/api/admin/carreras').then(r => r.json()).then(d => setCarreras(d.carreras || []))
  }
  useEffect(() => { cargar() }, [])

  const guardar = async () => {
    if (!form.nombre || !form.slug) {
      toast({ title: 'Error', description: 'Nombre y slug son requeridos', variant: 'destructive' })
      return
    }
    const url = edit ? `/api/admin/carreras/${edit.id}` : '/api/admin/carreras'
    const method = edit ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.ok) {
      toast({ title: edit ? 'Carrera actualizada' : 'Carrera creada' })
      setOpen(false)
      setEdit(null)
      setForm({ nombre: '', slug: '', descripcion: '', objetivo: '', perfilEgresado: '', campoLaboral: '', duracion: '3 años', imagen: '', galeria: '[]', activa: true })
      cargar()
    } else {
      toast({ title: 'Error', description: data.error, variant: 'destructive' })
    }
  }

  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar esta carrera?')) return
    const res = await fetch(`/api/admin/carreras/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast({ title: 'Carrera eliminada' })
      cargar()
    }
  }

  return (
    <Card className="iti-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Carreras ({carreras.length})</CardTitle>
          <Button size="sm" onClick={() => { setEdit(null); setOpen(true) }}><Plus className="h-4 w-4 mr-1" /> Nueva</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {carreras.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-3 border rounded-md">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {c.imagen && <img src={c.imagen} alt={c.nombre} className="h-10 w-10 rounded object-cover" />}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{c.nombre}</div>
                  <div className="text-xs text-muted-foreground">/{c.slug} · {c.duracion}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{c._count?.cursos || 0} cursos</Badge>
                  <Badge variant="outline" className="text-[10px]">{c._count?.estudiantes || 0} est.</Badge>
                  {c.activa ? <Badge className="bg-green-500/15 text-green-700">Activa</Badge> : <Badge variant="outline">Inactiva</Badge>}
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => { setEdit(c); setForm({ nombre: c.nombre, slug: c.slug, descripcion: c.descripcion, objetivo: c.objetivo, perfilEgresado: c.perfilEgresado, campoLaboral: c.campoLaboral, duracion: c.duracion, imagen: c.imagen || '', galeria: c.galeria || '[]', activa: c.activa }); setOpen(true) }}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => eliminar(c.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{edit ? 'Editar Carrera' : 'Nueva Carrera'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nombre *</Label>
                <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </div>
              <div>
                <Label>Slug *</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="computacion" />
              </div>
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea rows={3} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            </div>
            <div>
              <Label>Objetivo</Label>
              <Textarea rows={2} value={form.objetivo} onChange={(e) => setForm({ ...form, objetivo: e.target.value })} />
            </div>
            <div>
              <Label>Perfil del egresado</Label>
              <Textarea rows={3} value={form.perfilEgresado} onChange={(e) => setForm({ ...form, perfilEgresado: e.target.value })} />
            </div>
            <div>
              <Label>Campo laboral</Label>
              <Textarea rows={2} value={form.campoLaboral} onChange={(e) => setForm({ ...form, campoLaboral: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Duración</Label>
                <Input value={form.duracion} onChange={(e) => setForm({ ...form, duracion: e.target.value })} />
              </div>
              <div>
                <Label>Imagen (URL)</Label>
                <Input value={form.imagen} onChange={(e) => setForm({ ...form, imagen: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Galería (JSON array de URLs)</Label>
              <Textarea rows={2} value={form.galeria} onChange={(e) => setForm({ ...form, galeria: e.target.value })} />
            </div>
            <Button onClick={guardar} className="w-full bg-primary hover:bg-primary/90">{edit ? 'Actualizar' : 'Crear'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function CursosTab() {
  const { toast } = useToast()
  const [cursos, setCursos] = useState<any[]>([])
  const [carreras, setCarreras] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ nombre: '', carreraId: '', anio: '4', descripcion: '', pensum: '[]' })

  const cargar = () => {
    fetch('/api/admin/cursos').then(r => r.json()).then(d => setCursos(d.cursos || []))
    fetch('/api/admin/carreras').then(r => r.json()).then(d => setCarreras(d.carreras || []))
  }
  useEffect(() => { cargar() }, [])

  const crear = async () => {
    if (!form.nombre || !form.carreraId) {
      toast({ title: 'Error', description: 'Datos incompletos', variant: 'destructive' })
      return
    }
    const res = await fetch('/api/admin/cursos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.ok) {
      toast({ title: 'Curso creado' })
      setOpen(false)
      setForm({ nombre: '', carreraId: '', anio: '4', descripcion: '', pensum: '[]' })
      cargar()
    }
  }

  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar este curso?')) return
    await fetch(`/api/admin/cursos/${id}`, { method: 'DELETE' })
    toast({ title: 'Curso eliminado' })
    cargar()
  }

  return (
    <Card className="iti-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Cursos ({cursos.length})</CardTitle>
          <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Nuevo</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {cursos.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-3 border rounded-md">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{c.nombre}</div>
                <div className="text-xs text-muted-foreground">{c.carrera.nombre} · {c.anio}° año</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px]">{c._count?.inscripciones || 0} estudiantes</Badge>
                  <Badge variant="outline" className="text-[10px]">{c._count?.asignaciones || 0} docentes</Badge>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => eliminar(c.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Curso</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nombre *</Label>
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Carrera *</Label>
                <Select value={form.carreraId} onValueChange={(v) => setForm({ ...form, carreraId: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {carreras.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Año *</Label>
                <Select value={form.anio} onValueChange={(v) => setForm({ ...form, anio: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4° año</SelectItem>
                    <SelectItem value="5">5° año</SelectItem>
                    <SelectItem value="6">6° año</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea rows={2} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            </div>
            <div>
              <Label>Pensum (JSON de áreas)</Label>
              <Textarea rows={4} value={form.pensum} onChange={(e) => setForm({ ...form, pensum: e.target.value })}
                placeholder='[{"area":"Matemáticas","subarea":"Matemáticas","periodos":5}]' />
            </div>
            <Button onClick={crear} className="w-full bg-primary hover:bg-primary/90">Crear curso</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
