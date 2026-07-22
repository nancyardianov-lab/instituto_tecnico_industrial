'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore, useRouterStore } from '@/lib/store'
import {
  LayoutDashboard, User, BookOpen, ClipboardList, Award, Library,
  Calendar, Clock, Users, ChevronRight, Bell
} from 'lucide-react'
import { DocenteCursos } from './docente-cursos'
import { DocenteTareas } from './docente-tareas'
import { DocenteNotas } from './docente-notas'
import { DocenteBiblioteca } from './docente-biblioteca'
import { DocenteHorario } from './docente-horario'
import { EstudiantePerfil as DocentePerfil } from '../estudiante/estudiante-perfil'
import { NotificacionesBell } from '../shared/notificaciones-bell'

const NAV = [
  { key: 'dashboard', label: 'Panel Principal', icon: LayoutDashboard },
  { key: 'perfil', label: 'Perfil', icon: User },
  { key: 'cursos', label: 'Cursos', icon: BookOpen },
  { key: 'horario', label: 'Horario', icon: Calendar },
  { key: 'biblioteca', label: 'Biblioteca', icon: Library },
  { key: 'tareas', label: 'Tareas', icon: ClipboardList },
  { key: 'notas', label: 'Notas', icon: Award },
]

export function DocenteLayout() {
  const { user } = useAuthStore()
  const { path, setPath } = useRouterStore()
  const [active, setActive] = useState('dashboard')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const parts = path.split('/').filter(Boolean)
    if (parts[1]) setActive(parts[1])
    else setActive('dashboard')
  }, [path])

  useEffect(() => {
    if (active === 'dashboard') {
      fetch('/api/docente/dashboard').then(r => r.json()).then(d => {
        setData(d)
        setLoading(false)
      })
    }
  }, [active])

  if (!user) return <div className="container mx-auto px-4 py-20 text-center">Redirigiendo...</div>

  const navigate = (k: string) => {
    setActive(k)
    setPath(`/docente/${k === 'dashboard' ? '' : k}`)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col md:flex-row">
      <aside className="md:w-64 md:border-r md:bg-muted/30 border-b md:border-b-0 flex-shrink-0">
        <div className="p-4 border-b md:border-b flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={user.foto || ''} />
              <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{user.name}</div>
              <div className="text-xs text-muted-foreground truncate">{user.codigo}</div>
              <Badge className="text-[10px] mt-0.5 bg-accent/15 text-accent-foreground">Docente</Badge>
            </div>
          </div>
          <NotificacionesBell />
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
              <n.icon className="mr-2 h-4 w-4" />
              <span className="hidden md:inline">{n.label}</span>
            </Button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-6 max-w-full overflow-x-hidden">
        {active === 'dashboard' && <DocenteDashboard data={data} loading={loading} navigate={navigate} />}
        {active === 'perfil' && <DocentePerfil />}
        {active === 'cursos' && <DocenteCursos />}
        {active === 'horario' && <DocenteHorario />}
        {active === 'biblioteca' && <DocenteBiblioteca />}
        {active === 'tareas' && <DocenteTareas />}
        {active === 'notas' && <DocenteNotas />}
      </main>
    </div>
  )
}

function DocenteDashboard({ data, loading, navigate }: any) {
  if (loading || !data) {
    return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Cargando panel...</p></div>
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="iti-gradient text-white rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-1">¡Bienvenido/a, {data.user.name}!</h1>
        <p className="opacity-90">
          Docente{data.user.especialidad ? ` · ${data.user.especialidad}` : ''}{data.user.tituloProfesional ? ` · ${data.user.tituloProfesional}` : ''}
        </p>
        {!data.user.especialidad && !data.user.tituloProfesional && (
          <p className="text-xs opacity-80 mt-1">
            Sus cursos, grados y carreras serán asignados por el administrador.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="iti-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="h-4 w-4 text-primary" />
              <div className="text-xs text-muted-foreground">Cursos Asignados</div>
            </div>
            <div className="text-2xl font-bold text-primary">{data.totalCursos}</div>
          </CardContent>
        </Card>
        <Card className="iti-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-primary" />
              <div className="text-xs text-muted-foreground">Estudiantes</div>
            </div>
            <div className="text-2xl font-bold text-primary">{data.totalEstudiantes}</div>
          </CardContent>
        </Card>
        <Card className="iti-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="h-4 w-4 text-primary" />
              <div className="text-xs text-muted-foreground">Tareas Creadas</div>
            </div>
            <div className="text-2xl font-bold text-primary">{data.totalTareas}</div>
          </CardContent>
        </Card>
        <Card className="iti-card border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-amber-500" />
              <div className="text-xs text-muted-foreground">Por Revisar</div>
            </div>
            <div className="text-2xl font-bold text-amber-500">{data.tareasPendientesRevision}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Clases del día / próximas clases */}
        <Card className="iti-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> {data.horarioHoyLabel === 'Hoy' ? 'Clases de Hoy' : `Próximas Clases (${data.horarioHoyLabel})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.horarioHoy.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No tiene clases programadas esta semana.</p>
            ) : (
              <div className="space-y-2">
                {data.horarioHoy.map((h: any) => (
                  <div key={h.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/30">
                    <div className="text-xs font-medium text-primary w-20">{h.horaInicio} - {h.horaFin}</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{h.curso}</div>
                      <div className="text-xs text-muted-foreground">
                        {h.carrera}{h.anio ? ` · ${h.anio}° año` : ''}{h.aula ? ` · Aula: ${h.aula}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button variant="ghost" size="sm" className="w-full mt-3" onClick={() => navigate('horario')}>
              Ver horario completo <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Tareas por revisar */}
        <Card className="iti-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" /> Entregas por Revisar
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.ultimasEntregas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No hay entregas pendientes de revisión.</p>
            ) : (
              <div className="space-y-2">
                {data.ultimasEntregas.map((e: any) => (
                  <div key={e.id} className="p-2 rounded-md bg-muted/30">
                    <div className="text-sm font-medium line-clamp-1">{e.tarea.titulo}</div>
                    <div className="text-xs text-muted-foreground">{e.estudiante.user.name}</div>
                  </div>
                ))}
              </div>
            )}
            <Button variant="ghost" size="sm" className="w-full mt-3" onClick={() => navigate('tareas')}>
              Ver todas <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Cursos */}
      <Card className="iti-card">
        <CardHeader>
          <CardTitle className="text-base">Mis Cursos Asignados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.cursos.map((c: any) => (
              <div key={c.id} className="border rounded-md p-3 bg-muted/20">
                <div className="font-semibold text-sm">{c.nombre}</div>
                <div className="text-xs text-muted-foreground mb-2">{c.carrera}</div>
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="outline">{c.anio}° año</Badge>
                  <Badge variant="outline">{c.totalEstudiantes} estudiantes</Badge>
                </div>
              </div>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="w-full mt-3" onClick={() => navigate('cursos')}>
            Ver cursos completos <ChevronRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Avisos y notificaciones */}
      <DocenteNotificacionesPanel />
    </div>
  )
}

function DocenteNotificacionesPanel() {
  const [notifs, setNotifs] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/notificaciones').then(r => r.json()).then(d => setNotifs(d.notificaciones || []))
  }, [])

  return (
    <Card className="iti-card">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" /> Avisos y Notificaciones
        </CardTitle>
      </CardHeader>
      <CardContent>
        {notifs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No hay notificaciones.</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
            {notifs.slice(0, 8).map((n: any) => (
              <div key={n.id} className="p-3 rounded-md bg-muted/30 border-l-2 border-primary">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium text-sm">{n.titulo}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(n.fechaPublicacion).toLocaleDateString('es-GT')}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{n.mensaje}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
