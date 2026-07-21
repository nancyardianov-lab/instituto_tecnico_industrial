'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore, useRouterStore } from '@/lib/store'
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Library, FileText,
  Mail, Bell, Settings, FolderTree, ClipboardList, Award
} from 'lucide-react'
import { AdminUsuarios } from './admin-usuarios'
import { AdminPreinscripciones } from './admin-preinscripciones'
import { AdminAcademica } from './admin-academica'
import { AdminContenido } from './admin-contenido'
import { AdminPlantillas } from './admin-plantillas'
import { AdminBiblioteca } from './admin-biblioteca'
import { AdminNotificaciones } from './admin-notificaciones'
import { AdminCorreo } from './admin-correo'
import { EstudiantePerfil as AdminPerfil } from '../estudiante/estudiante-perfil'

const NAV = [
  { key: 'dashboard', label: 'Panel Principal', icon: LayoutDashboard },
  { key: 'perfil', label: 'Perfil', icon: Settings },
  { key: 'usuarios', label: 'Usuarios', icon: Users },
  { key: 'preinscripciones', label: 'Preinscripciones', icon: GraduationCap },
  { key: 'academica', label: 'Gestión Académica', icon: FolderTree },
  { key: 'contenido', label: 'Contenido', icon: FileText },
  { key: 'biblioteca', label: 'Biblioteca', icon: Library },
  { key: 'plantillas', label: 'Plantillas Correos', icon: Mail },
  { key: 'correo', label: 'Correo SMTP', icon: Mail },
  { key: 'notificaciones', label: 'Notificaciones', icon: Bell },
]

export function AdminLayout() {
  const { user } = useAuthStore()
  const { path, setPath } = useRouterStore()
  const [active, setActive] = useState('dashboard')
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const parts = path.split('/').filter(Boolean)
    if (parts[1]) setActive(parts[1])
    else setActive('dashboard')
  }, [path])

  useEffect(() => {
    if (active === 'dashboard') {
      fetch('/api/admin/estadisticas').then(r => r.json()).then(d => {
        setStats(d)
        setLoading(false)
      })
    }
  }, [active])

  if (!user) return <div className="container mx-auto px-4 py-20 text-center">Redirigiendo...</div>

  const navigate = (k: string) => {
    setActive(k)
    setPath(`/admin/${k === 'dashboard' ? '' : k}`)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col md:flex-row">
      <aside className="md:w-64 md:border-r md:bg-muted/30 border-b md:border-b-0 flex-shrink-0">
        <div className="p-4 border-b md:border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.foto || ''} />
              <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{user.name}</div>
              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
              <Badge className="text-[10px] mt-0.5 bg-primary text-primary-foreground">Administrador</Badge>
            </div>
          </div>
        </div>
        <nav className="p-2 flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
          {NAV.map((n) => (
            <Button
              key={n.key}
              variant={active === n.key ? 'default' : 'ghost'}
              size="sm"
              onClick={() => navigate(n.key)}
              className={`justify-start md:w-full flex-shrink-0 ${active === n.key ? 'bg-primary text-primary-foreground' : ''}`}
            >
              <n.icon className="mr-2 h-4 w-4 flex-shrink-0" />
              <span className="hidden md:inline">{n.label}</span>
            </Button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-6 max-w-full overflow-x-hidden">
        {active === 'dashboard' && <AdminDashboard stats={stats} loading={loading} navigate={navigate} />}
        {active === 'perfil' && <AdminPerfil />}
        {active === 'usuarios' && <AdminUsuarios />}
        {active === 'preinscripciones' && <AdminPreinscripciones />}
        {active === 'academica' && <AdminAcademica />}
        {active === 'contenido' && <AdminContenido />}
        {active === 'biblioteca' && <AdminBiblioteca />}
        {active === 'plantillas' && <AdminPlantillas />}
        {active === 'correo' && <AdminCorreo />}
        {active === 'notificaciones' && <AdminNotificaciones />}
      </main>
    </div>
  )
}

function AdminDashboard({ stats, loading, navigate }: any) {
  if (loading || !stats) {
    return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Cargando panel...</p></div>
  }

  const cards = [
    { label: 'Estudiantes', value: stats.totalEstudiantes, icon: GraduationCap, color: 'text-blue-600 bg-blue-50' },
    { label: 'Docentes', value: stats.totalDocentes, icon: Users, color: 'text-purple-600 bg-purple-50' },
    { label: 'Preinscr. Pendientes', value: stats.preinscripcionesPendientes, icon: ClipboardList, color: 'text-amber-600 bg-amber-50' },
    { label: 'Solicitudes Docentes', value: stats.solicitudesDocentesPendientes, icon: Users, color: 'text-pink-600 bg-pink-50' },
    { label: 'Carreras', value: stats.totalCarreras, icon: BookOpen, color: 'text-green-600 bg-green-50' },
    { label: 'Cursos', value: stats.totalCursos, icon: FolderTree, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Libros', value: stats.totalLibros, icon: Library, color: 'text-cyan-600 bg-cyan-50' },
    { label: 'Noticias', value: stats.totalNoticias, icon: FileText, color: 'text-red-600 bg-red-50' },
    { label: 'Correos Enviados', value: stats.totalCorreosEnviados, icon: Mail, color: 'text-orange-600 bg-orange-50' },
  ]

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="iti-gradient text-white rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-1">Panel de Administración</h1>
        <p className="opacity-90">Resumen general del sistema del Instituto Técnico Industrial</p>
      </div>

      {/* Tarjetas estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((c, i) => (
          <Card key={i} className="iti-card">
            <CardContent className="p-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${c.color}`}>
                <c.icon className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold">{c.value}</div>
              <div className="text-xs text-muted-foreground">{c.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Accesos rápidos */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        <Card className="iti-card cursor-pointer hover:border-primary/40" onClick={() => navigate('preinscripciones')}>
          <CardContent className="p-4 flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-primary" />
            <div>
              <div className="font-semibold text-sm">Revisar Preinscripciones</div>
              <div className="text-xs text-muted-foreground">{stats.preinscripcionesPendientes} pendientes de revisión</div>
            </div>
          </CardContent>
        </Card>
        <Card className="iti-card cursor-pointer hover:border-primary/40" onClick={() => navigate('usuarios')}>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <div className="font-semibold text-sm">Gestión de Usuarios</div>
              <div className="text-xs text-muted-foreground">{stats.solicitudesDocentesPendientes} solicitudes de docente pendientes</div>
            </div>
          </CardContent>
        </Card>
        <Card className="iti-card cursor-pointer hover:border-primary/40" onClick={() => navigate('academica')}>
          <CardContent className="p-4 flex items-center gap-3">
            <FolderTree className="h-8 w-8 text-primary" />
            <div>
              <div className="font-semibold text-sm">Gestión Académica</div>
              <div className="text-xs text-muted-foreground">Carreras, cursos, asignaciones</div>
            </div>
          </CardContent>
        </Card>
        <Card className="iti-card cursor-pointer hover:border-primary/40" onClick={() => navigate('contenido')}>
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <div className="font-semibold text-sm">Gestión de Contenido</div>
              <div className="text-xs text-muted-foreground">Noticias, eventos, galería, FAQ</div>
            </div>
          </CardContent>
        </Card>
        <Card className="iti-card cursor-pointer hover:border-primary/40" onClick={() => navigate('plantillas')}>
          <CardContent className="p-4 flex items-center gap-3">
            <Mail className="h-8 w-8 text-primary" />
            <div>
              <div className="font-semibold text-sm">Plantillas de Correo</div>
              <div className="text-xs text-muted-foreground">Personalice correos automáticos</div>
            </div>
          </CardContent>
        </Card>
        <Card className="iti-card cursor-pointer hover:border-primary/40" onClick={() => navigate('notificaciones')}>
          <CardContent className="p-4 flex items-center gap-3">
            <Bell className="h-8 w-8 text-primary" />
            <div>
              <div className="font-semibold text-sm">Notificaciones</div>
              <div className="text-xs text-muted-foreground">Publicar avisos generales</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preinscripciones por estado */}
      <Card className="iti-card">
        <CardHeader>
          <CardTitle className="text-base">Preinscripciones por Estado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {stats.preinscripcionesByStatus?.map((p: any) => (
              <div key={p.status} className="text-center p-3 rounded-md bg-muted/30">
                <div className="text-2xl font-bold text-primary">{p._count}</div>
                <div className="text-xs text-muted-foreground">{p.status.replace(/_/g, ' ').toLowerCase()}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Estudiantes por carrera */}
      <Card className="iti-card">
        <CardHeader>
          <CardTitle className="text-base">Estudiantes por Carrera</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.estudiantesPorCarrera?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No hay datos disponibles.</p>
          ) : (
            <div className="space-y-2">
              {stats.estudiantesPorCarrera?.map((e: any, i: number) => {
                const max = Math.max(...stats.estudiantesPorCarrera.map((x: any) => x.cantidad), 1)
                const pct = (e.cantidad / max) * 100
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{e.carrera}</span>
                      <Badge variant="outline">{e.cantidad}</Badge>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
