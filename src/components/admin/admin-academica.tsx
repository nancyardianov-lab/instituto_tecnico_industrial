'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, FolderTree, BookOpen, Users, Edit, Trash2, Calendar, UserPlus, Clock, MapPin, Upload, Image as ImageIcon, X, Loader2 } from 'lucide-react'
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
  const [subiendoImagen, setSubiendoImagen] = useState(false)
  const imagenInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    nombre: '', slug: '', descripcion: '', objetivo: '', perfilEgresado: '', campoLaboral: '',
    duracion: '3 años', imagen: '', galeria: '[]', activa: true,
  })

  const cargar = () => {
    fetch('/api/admin/carreras').then(r => r.json()).then(d => setCarreras(d.carreras || []))
  }
  useEffect(() => { cargar() }, [])

  const subirImagen = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Imagen demasiado grande', description: 'El máximo es 2 MB', variant: 'destructive' })
      return
    }
    setSubiendoImagen(true)
    try {
      const fd = new FormData()
      fd.append('imagen', file)
      const res = await fetch('/api/admin/upload-imagen', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.ok) {
        setForm(f => ({ ...f, imagen: data.url }))
        toast({ title: 'Imagen subida' })
      } else {
        toast({ title: 'Error', description: data.error || 'No se pudo subir la imagen', variant: 'destructive' })
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Error inesperado', variant: 'destructive' })
    } finally {
      setSubiendoImagen(false)
    }
  }

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
            <div>
              <Label>Duración</Label>
              <Input value={form.duracion} onChange={(e) => setForm({ ...form, duracion: e.target.value })} />
            </div>
            {/* Imagen de la carrera - subida desde dispositivo */}
            <div>
              <Label>Imagen de la carrera <span className="text-muted-foreground font-normal">(sube desde tu dispositivo)</span></Label>
              <div className="space-y-2">
                <input
                  ref={imagenInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) subirImagen(f)
                  }}
                />
                {form.imagen ? (
                  <div className="space-y-2">
                    <div className="relative inline-block">
                      <img src={form.imagen} alt="Vista previa" className="h-32 w-full max-w-xs object-cover rounded-lg border" />
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, imagen: '' }))}
                        className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 hover:bg-destructive/80"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => imagenInputRef.current?.click()} disabled={subiendoImagen}>
                      {subiendoImagen ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <ImageIcon className="h-3 w-3 mr-1" />}
                      Cambiar imagen
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => imagenInputRef.current?.click()}
                    className="border-2 border-dashed border-primary/30 rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    {subiendoImagen ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        <span className="text-sm">Subiendo imagen...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <Upload className="h-8 w-8 text-primary/60" />
                        <div className="text-sm font-medium">Haz clic para seleccionar una imagen</div>
                        <div className="text-xs text-muted-foreground">JPG, PNG, WebP, GIF · máx 2 MB</div>
                      </div>
                    )}
                  </div>
                )}
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
  const [filtroCarrera, setFiltroCarrera] = useState('TODOS')
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
      toast({ title: 'Curso creado', description: `"${form.nombre}" agregado correctamente` })
      setOpen(false)
      setForm({ nombre: '', carreraId: '', anio: '4', descripcion: '', pensum: '[]' })
      cargar()
    }
  }

  const eliminar = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar el curso "${nombre}"? Se borrarán también sus horarios, tareas y calificaciones asociadas.`)) return
    await fetch(`/api/admin/cursos/${id}`, { method: 'DELETE' })
    toast({ title: 'Curso eliminado' })
    cargar()
  }

  const cursosFiltrados = filtroCarrera === 'TODOS'
    ? cursos
    : cursos.filter(c => c.carreraId === filtroCarrera)

  // Agrupar por carrera
  const porCarrera: Record<string, any[]> = {}
  cursosFiltrados.forEach(c => {
    const key = c.carrera?.nombre || 'Sin carrera'
    if (!porCarrera[key]) porCarrera[key] = []
    porCarrera[key].push(c)
  })

  return (
    <Card className="iti-card">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-base">Cursos / Materias Individuales ({cursos.length})</CardTitle>
            <CardDescription className="text-xs mt-1">
              Cada curso es una materia individual dentro de una carrera y año. Ej: en 6° Computación están Organización de Empresas, Seminario, Electrónica, Programación, etc.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={filtroCarrera} onValueChange={setFiltroCarrera}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Filtrar carrera" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todas las carreras</SelectItem>
                {carreras.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Nuevo</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {cursosFiltrados.length === 0 ? (
          <div className="text-center py-8 bg-muted/20 rounded-md">
            <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No hay cursos creados. Haga clic en "Nuevo" para crear materias individuales (ej: Organización de Empresas, Programación, etc.)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(porCarrera).map(([carreraNombre, lista]) => (
              <div key={carreraNombre}>
                <div className="text-sm font-semibold text-primary mb-2 border-b pb-1">{carreraNombre}</div>
                <div className="space-y-2">
                  {lista.sort((a, b) => a.anio - b.anio).map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 border rounded-md bg-muted/10">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{c.nombre}</div>
                        <div className="text-xs text-muted-foreground">{c.anio}° año</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px]">{c._count?.inscripciones || 0} estudiantes</Badge>
                          <Badge variant="outline" className="text-[10px]">{c._count?.asignaciones || 0} docentes</Badge>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => eliminar(c.id, c.nombre)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Curso / Materia</DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Cree una materia individual para una carrera y año específicos. Ej: "Organización de Empresas" para 6° Computación.
            </p>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nombre del curso / materia *</Label>
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Organización de Empresas, Programación, Electrónica..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Carrera *</Label>
                <Select value={form.carreraId} onValueChange={(v) => setForm({ ...form, carreraId: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar carrera" /></SelectTrigger>
                  <SelectContent>
                    {carreras.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Año / Grado *</Label>
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
              <Textarea rows={2} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Breve descripción del contenido del curso" />
            </div>
            <div>
              <Label>Pensum (JSON de áreas - opcional)</Label>
              <Textarea rows={3} value={form.pensum} onChange={(e) => setForm({ ...form, pensum: e.target.value })}
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
  const [carreras, setCarreras] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [filtroCarrera, setFiltroCarrera] = useState('TODOS')
  const [filtroAnio, setFiltroAnio] = useState('TODOS')
  const [form, setForm] = useState({ cursoId: '', docenteId: '', anio: '' })

  const cargar = () => {
    fetch('/api/admin/asignaciones').then(r => r.json()).then(d => setAsignaciones(d.asignaciones || []))
    fetch('/api/admin/docentes').then(r => r.json()).then(d => setDocentes(d.docentes || []))
    fetch('/api/admin/cursos').then(r => r.json()).then(d => setCursos(d.cursos || []))
    fetch('/api/admin/carreras').then(r => r.json()).then(d => setCarreras(d.carreras || []))
  }
  useEffect(() => { cargar() }, [])

  // Filtrar cursos según carrera y año seleccionados en el diálogo
  const cursosFiltrados = cursos.filter(c => {
    if (filtroCarrera !== 'TODOS' && c.carreraId !== filtroCarrera) return false
    if (filtroAnio !== 'TODOS' && String(c.anio) !== filtroAnio) return false
    return true
  })

  // Al seleccionar un curso, auto-llenar el año desde el curso
  const seleccionarCurso = (cursoId: string) => {
    const curso = cursos.find(c => c.id === cursoId)
    setForm(f => ({ ...f, cursoId, anio: curso ? String(curso.anio) : '' }))
  }

  // Detectar si la materia seleccionada ya tiene un docente asignado
  const materiaSeleccionada = cursos.find(c => c.id === form.cursoId)
  const asignacionExistente = materiaSeleccionada
    ? asignaciones.find(a => a.cursoId === form.cursoId)
    : null

  const crear = async () => {
    if (!form.cursoId || !form.docenteId) {
      toast({ title: 'Error', description: 'Seleccione curso y docente', variant: 'destructive' })
      return
    }
    if (!form.anio) {
      toast({ title: 'Error', description: 'Debe seleccionar un curso que tenga año asignado', variant: 'destructive' })
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
      setForm({ cursoId: '', docenteId: '', anio: '' })
      setFiltroCarrera('TODOS')
      setFiltroAnio('TODOS')
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

  // Agrupar asignaciones por docente
  const porDocente: Record<string, any[]> = {}
  asignaciones.forEach(a => {
    const key = a.docente.user.name
    if (!porDocente[key]) porDocente[key] = []
    porDocente[key].push(a)
  })

  return (
    <Card className="iti-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> Asignación de Materias a Docentes
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Asigne a cada docente qué materia individual impartirá, en qué carrera y en qué año/grado. Ej: Prof. Pérez → Programación → 6° Computación. <strong>Una materia solo puede tener un docente asignado.</strong>
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
              No hay docentes activos todavía. Apruebe solicitudes de docentes desde "Usuarios" para poder asignarles materias.
            </p>
          </div>
        ) : asignaciones.length === 0 ? (
          <div className="text-center py-8 bg-muted/20 rounded-md">
            <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Aún no hay asignaciones. Haga clic en "Nueva asignación" para indicar qué materias impartirá cada docente.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(porDocente).map(([docenteNombre, lista]) => (
              <div key={docenteNombre}>
                <div className="flex items-center gap-2 mb-2 border-b pb-1">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {docenteNombre.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{docenteNombre}</div>
                    <div className="text-xs text-muted-foreground">{lista[0].docente.user.email}</div>
                  </div>
                </div>
                <div className="space-y-1 ml-10">
                  {lista.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-2 border rounded-md bg-muted/10">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm">{a.curso.nombre}</span>
                        <span className="text-xs text-muted-foreground ml-2">{a.curso.carrera.nombre} · {a.anio}° año</span>
                      </div>
                      <Button size="sm" variant="ghost" className="h-7" onClick={() => eliminar(a.id, a.docente.user.name, a.curso.nombre)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Asignar Materia a Docente</DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Seleccione el docente, luego filtre por carrera y año para encontrar la materia que impartirá. <strong>Una materia solo puede tener un docente.</strong>
            </p>
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

            {/* Filtros para encontrar el curso */}
            <div className="bg-muted/20 p-3 rounded-md space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Filtros para encontrar el curso:</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Carrera</Label>
                  <Select value={filtroCarrera} onValueChange={setFiltroCarrera}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todas</SelectItem>
                      {carreras.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Año / Grado</Label>
                  <Select value={filtroAnio} onValueChange={setFiltroAnio}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos</SelectItem>
                      <SelectItem value="4">4° año</SelectItem>
                      <SelectItem value="5">5° año</SelectItem>
                      <SelectItem value="6">6° año</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <Label>Curso / Materia *</Label>
              <Select value={form.cursoId} onValueChange={seleccionarCurso}>
                <SelectTrigger><SelectValue placeholder={cursosFiltrados.length === 0 ? 'No hay cursos con estos filtros' : 'Seleccionar curso'} /></SelectTrigger>
                <SelectContent>
                  {cursosFiltrados.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre} · {c.carrera.nombre} · {c.anio}°
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {cursosFiltrados.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">No hay cursos con los filtros seleccionados. Cree cursos en la pestaña "Cursos" o cambie los filtros.</p>
              )}
            </div>

            {form.cursoId && (
              <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded text-xs text-blue-800 dark:text-blue-200">
                <div className="font-medium mb-1">Resumen de la asignación:</div>
                <div>Docente: <strong>{docentes.find(d => d.id === form.docenteId)?.user.name || '—'}</strong></div>
                <div>Materia: <strong>{cursos.find(c => c.id === form.cursoId)?.nombre || '—'}</strong></div>
                <div>Carrera: <strong>{cursos.find(c => c.id === form.cursoId)?.carrera.nombre || '—'}</strong></div>
                <div>Año: <strong>{form.anio}°</strong></div>
              </div>
            )}

            {asignacionExistente && asignacionExistente.docenteId !== form.docenteId && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800 p-3 rounded text-xs text-red-800 dark:text-red-200">
                <div className="font-medium mb-1">⚠ Esta materia ya tiene docente asignado</div>
                <div>Docente actual: <strong>{asignacionExistente.docente.user.name}</strong></div>
                <div className="mt-1">Una materia solo puede tener un docente. Para asignarla a otro, primero elimine la asignación actual en la lista de la izquierda.</div>
              </div>
            )}

            <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded text-xs text-amber-800 dark:text-amber-200">
              Al asignar la materia, el docente podrá:
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li>Ver la materia en su panel principal</li>
                <li>Crear tareas para los estudiantes inscritos</li>
                <li>Registrar y publicar calificaciones</li>
                <li>Subir materiales a la biblioteca vinculados a la materia</li>
              </ul>
            </div>
            <Button
              onClick={crear}
              className="w-full bg-primary hover:bg-primary/90"
              disabled={!form.cursoId || !form.docenteId || !!(asignacionExistente && asignacionExistente.docenteId !== form.docenteId)}
            >
              <UserPlus className="h-4 w-4 mr-2" /> Asignar materia
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
