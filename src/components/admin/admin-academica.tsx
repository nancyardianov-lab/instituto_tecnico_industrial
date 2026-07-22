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
import { Plus, FolderTree, BookOpen, Users, Edit, Trash2, Calendar, UserPlus, Clock, MapPin } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function AdminAcademica() {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold mb-2">Gestión Académica</h1>
        <p className="text-muted-foreground text-sm">Administre carreras, cursos, asignación de docentes y horarios.</p>
      </div>
      <Tabs defaultValue="carreras">
        <TabsList>
          <TabsTrigger value="carreras">Carreras</TabsTrigger>
          <TabsTrigger value="cursos">Cursos</TabsTrigger>
          <TabsTrigger value="asignaciones">Asignar Docentes</TabsTrigger>
          <TabsTrigger value="horarios">Horarios</TabsTrigger>
        </TabsList>
        <TabsContent value="carreras"><CarrerasTab /></TabsContent>
        <TabsContent value="cursos"><CursosTab /></TabsContent>
        <TabsContent value="asignaciones"><AsignacionesTab /></TabsContent>
        <TabsContent value="horarios"><HorariosTab /></TabsContent>
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
    if (!confirm('¿Eliminar esta carrera? Se borrarán también sus cursos y horarios.')) return
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
    if (!confirm('¿Eliminar este curso? Se borrarán también sus horarios, tareas y calificaciones asociadas.')) return
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

// =====================================================
// ASIGNACIONES DE DOCENTES A CURSOS
// =====================================================
function AsignacionesTab() {
  const { toast } = useToast()
  const [asignaciones, setAsignaciones] = useState<any[]>([])
  const [docentes, setDocentes] = useState<any[]>([])
  const [cursos, setCursos] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ cursoId: '', docenteId: '', anio: '4' })

  const cargar = () => {
    fetch('/api/admin/asignaciones').then(r => r.json()).then(d => setAsignaciones(d.asignaciones || []))
    fetch('/api/admin/docentes').then(r => r.json()).then(d => setDocentes(d.docentes || []))
    fetch('/api/admin/cursos').then(r => r.json()).then(d => setCursos(d.cursos || []))
  }
  useEffect(() => { cargar() }, [])

  const crear = async () => {
    if (!form.cursoId || !form.docenteId) {
      toast({ title: 'Error', description: 'Seleccione curso y docente', variant: 'destructive' })
      return
    }
    const res = await fetch('/api/admin/asignaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.ok) {
      toast({ title: 'Curso asignado', description: 'El docente ahora podrá gestionar este curso' })
      setOpen(false)
      setForm({ cursoId: '', docenteId: '', anio: '4' })
      cargar()
    } else {
      toast({ title: 'Error', description: data.error || 'No se pudo asignar', variant: 'destructive' })
    }
  }

  const eliminar = async (id: string, docente: string, curso: string) => {
    if (!confirm(`¿Quitar la asignación del curso "${curso}" al docente "${docente}"?\n\nEl docente dejará de ver este curso en su panel. Las tareas y notas ya creadas NO se borrarán.`)) return
    const res = await fetch(`/api/admin/asignaciones/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.ok) {
      toast({ title: 'Asignación eliminada' })
      cargar()
    } else {
      toast({ title: 'Error', description: data.error || 'No se pudo eliminar', variant: 'destructive' })
    }
  }

  return (
    <Card className="iti-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> Asignación de Cursos a Docentes
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Indique a cada docente qué curso, año y carrera impartirá. Sin esta asignación, el docente no verá ningún curso en su panel.
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setOpen(true)} disabled={docentes.length === 0 || cursos.length === 0}>
            <Plus className="h-4 w-4 mr-1" /> Nueva asignación
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {docentes.length === 0 ? (
          <div className="text-center py-8 bg-muted/20 rounded-md">
            <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No hay docentes activos todavía. Apruebe solicitudes de docentes desde "Usuarios" para poder asignarles cursos.
            </p>
          </div>
        ) : asignaciones.length === 0 ? (
          <div className="text-center py-8 bg-muted/20 rounded-md">
            <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Aún no hay asignaciones. Haga clic en "Nueva asignación" para indicar qué cursos impartirá cada docente.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {asignaciones.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                    {a.docente.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{a.docente.user.name}</div>
                    <div className="text-xs text-muted-foreground">{a.docente.user.email}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-sm">{a.curso.nombre}</div>
                    <div className="text-xs text-muted-foreground">{a.curso.carrera.nombre} · {a.anio}° año</div>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => eliminar(a.id, a.docente.user.name, a.curso.nombre)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Curso a Docente</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Docente *</Label>
              <Select value={form.docenteId} onValueChange={(v) => setForm({ ...form, docenteId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar docente" /></SelectTrigger>
                <SelectContent>
                  {docentes.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.user.name} {d.user.codigo ? `(${d.user.codigo})` : ''} · {d._count.cursos} cursos
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Curso *</Label>
              <Select value={form.cursoId} onValueChange={(v) => setForm({ ...form, cursoId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar curso" /></SelectTrigger>
                <SelectContent>
                  {cursos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre} · {c.carrera.nombre} · {c.anio}°
                    </SelectItem>
                  ))}
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
            <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded text-xs text-blue-800 dark:text-blue-200">
              Al asignar el curso, el docente podrá:
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li>Ver el curso en su panel principal</li>
                <li>Crear tareas para los estudiantes inscritos</li>
                <li>Registrar y publicar calificaciones</li>
                <li>Subir materiales a la biblioteca vinculados al curso</li>
              </ul>
            </div>
            <Button onClick={crear} className="w-full bg-primary hover:bg-primary/90">
              <UserPlus className="h-4 w-4 mr-2" /> Asignar curso
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

// =====================================================
// HORARIOS DE CURSOS
// =====================================================
function HorariosTab() {
  const { toast } = useToast()
  const [horarios, setHorarios] = useState<any[]>([])
  const [cursos, setCursos] = useState<any[]>([])
  const [cursoFiltro, setCursoFiltro] = useState('TODOS')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ cursoId: '', dia: 'LUNES', horaInicio: '07:00', horaFin: '08:30', aula: '' })

  const cargar = () => {
    const url = cursoFiltro !== 'TODOS' ? `/api/admin/horarios?cursoId=${cursoFiltro}` : '/api/admin/horarios'
    fetch(url).then(r => r.json()).then(d => setHorarios(d.horarios || []))
    fetch('/api/admin/cursos').then(r => r.json()).then(d => setCursos(d.cursos || []))
  }
  useEffect(() => { cargar() }, [cursoFiltro])

  const crear = async () => {
    if (!form.cursoId) {
      toast({ title: 'Error', description: 'Seleccione un curso', variant: 'destructive' })
      return
    }
    const res = await fetch('/api/admin/horarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.ok) {
      toast({ title: 'Horario creado', description: 'Los estudiantes inscritos lo verán automáticamente' })
      setOpen(false)
      setForm({ cursoId: '', dia: 'LUNES', horaInicio: '07:00', horaFin: '08:30', aula: '' })
      cargar()
    } else {
      toast({ title: 'Error', description: data.error || 'No se pudo crear', variant: 'destructive' })
    }
  }

  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar este horario? Los estudiantes y docentes dejarán de verlo.')) return
    const res = await fetch(`/api/admin/horarios/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.ok) {
      toast({ title: 'Horario eliminado' })
      cargar()
    } else {
      toast({ title: 'Error', description: data.error || 'No se pudo eliminar', variant: 'destructive' })
    }
  }

  const DIAS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES']

  return (
    <Card className="iti-card">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Horarios de Clases
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Defina los días y horas en que se imparte cada curso. Los estudiantes inscritos verán automáticamente su horario.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={cursoFiltro} onValueChange={setCursoFiltro}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Filtrar curso" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos los cursos</SelectItem>
                {cursos.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => setOpen(true)} disabled={cursos.length === 0}>
              <Plus className="h-4 w-4 mr-1" /> Nuevo horario
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {cursos.length === 0 ? (
          <div className="text-center py-8 bg-muted/20 rounded-md">
            <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Primero debe crear cursos en la pestaña "Cursos" para poder asignarles horarios.
            </p>
          </div>
        ) : horarios.length === 0 ? (
          <div className="text-center py-8 bg-muted/20 rounded-md">
            <Calendar className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No hay horarios definidos. Haga clic en "Nuevo horario" para empezar.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="text-left p-2">Curso</th>
                  <th className="text-left p-2">Carrera</th>
                  <th className="text-left p-2">Día</th>
                  <th className="text-left p-2">Hora</th>
                  <th className="text-left p-2">Aula</th>
                  <th className="text-center p-2">Estudiantes</th>
                  <th className="text-center p-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {horarios.map((h) => (
                  <tr key={h.id} className="border-b hover:bg-muted/10">
                    <td className="p-2 font-medium">{h.curso.nombre}</td>
                    <td className="p-2 text-xs">{h.curso.carrera.nombre}</td>
                    <td className="p-2"><Badge variant="outline" className="text-[10px]">{h.dia}</Badge></td>
                    <td className="p-2 text-xs">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {h.horaInicio} - {h.horaFin}
                      </span>
                    </td>
                    <td className="p-2 text-xs">
                      {h.aula ? <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {h.aula}</span> : '—'}
                    </td>
                    <td className="p-2 text-center text-xs">{h._count?.estudiantes || 0}</td>
                    <td className="p-2 text-center">
                      <Button size="sm" variant="ghost" onClick={() => eliminar(h.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Horario de Clase</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Curso *</Label>
              <Select value={form.cursoId} onValueChange={(v) => setForm({ ...form, cursoId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar curso" /></SelectTrigger>
                <SelectContent>
                  {cursos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre} · {c.carrera.nombre} · {c.anio}°
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Día *</Label>
              <Select value={form.dia} onValueChange={(v) => setForm({ ...form, dia: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DIAS.map((d) => (
                    <SelectItem key={d} value={d}>{d.charAt(0) + d.slice(1).toLowerCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Hora inicio *</Label>
                <Input type="time" value={form.horaInicio} onChange={(e) => setForm({ ...form, horaInicio: e.target.value })} />
              </div>
              <div>
                <Label>Hora fin *</Label>
                <Input type="time" value={form.horaFin} onChange={(e) => setForm({ ...form, horaFin: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Aula</Label>
              <Input value={form.aula} onChange={(e) => setForm({ ...form, aula: e.target.value })} placeholder="Ej: Aula 12" />
            </div>
            <Button onClick={crear} className="w-full bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" /> Crear horario
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
