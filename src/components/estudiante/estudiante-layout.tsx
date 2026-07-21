'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { useAuthStore, useRouterStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import {
  LayoutDashboard, User, BookOpen, FileText, Calendar, Bell,
  GraduationCap, Clock, TrendingUp, ChevronRight, Library, ClipboardList, Award
} from 'lucide-react'
import { EstudianteNotas } from './estudiante-notas'
import { EstudianteBiblioteca } from './estudiante-biblioteca'
import { EstudianteTareas } from './estudiante-tareas'
import { EstudianteHorario } from './estudiante-horario'
import { EstudiantePerfil } from './estudiante-perfil'

const NAV = [
  { key: 'dashboard', label: 'Panel Principal', icon: LayoutDashboard },
  { key: 'perfil', label: 'Perfil', icon: User },
  { key: 'notas', label: 'Notas', icon: Award },
  { key: 'biblioteca', label: 'Biblioteca', icon: Library },
  { key: 'tareas', label: 'Tareas', icon: ClipboardList },
  { key: 'horario', label: 'Horario', icon: Calendar },
]

export function EstudianteLayout() {
  const { user } = useAuthStore()
  const { path, setPath } = useRouterStore()
  const { toast } = useToast()
  const [active, setActive] = useState('dashboard')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState<any[]>([])

  // Determinar sección activa por hash
  useEffect(() => {
    const parts = path.split('/').filter(Boolean)
    if (parts[1]) setActive(parts[1])
    else setActive('dashboard')
  }, [path])

  useEffect(() => {
    if (active === 'dashboard') {
      fetch('/api/estudiante/dashboard').then(r => r.json()).then(d => {
        setData(d)
        setLoading(false)
      })
    }
  }, [active])

  useEffect(() => {
    fetch('/api/notificaciones').then(r => r.json()).then(d => setNotifs(d.notificaciones || []))
  }, [])

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p>Redirigiendo...</p>
      </div>
    )
  }

  const navigate = (k: string) => {
    setActive(k)
    setPath(`/estudiante/${k === 'dashboard' ? '' : k}`)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="md:w-64 md:border-r md:bg-muted/30 border-b md:border-b-0 flex-shrink-0">
        <div className="p-4 border-b md:border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.foto || ''} />
              <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{user.name}</div>
              <div className="text-xs text-muted-foreground truncate">{user.codigo}</div>
              <Badge className="text-[10px] mt-0.5 bg-primary/10 text-primary">Estudiante</Badge>
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
              <n.icon className="mr-2 h-4 w-4" />
              <span className="hidden md:inline">{n.label}</span>
            </Button>
          ))}
        </nav>
      </aside>

      {/* Contenido */}
      <main className="flex-1 p-4 md:p-6 max-w-full overflow-x-hidden">
        {active === 'dashboard' && (
          <EstudianteDashboard data={data} loading={loading} notifs={notifs} navigate={navigate} />
        )}
        {active === 'perfil' && <EstudiantePerfil />}
        {active === 'notas' && <EstudianteNotas />}
        {active === 'biblioteca' && <EstudianteBiblioteca />}
        {active === 'tareas' && <EstudianteTareas />}
        {active === 'horario' && <EstudianteHorario />}
      </main>
    </div>
  )
}

function EstudianteDashboard({ data, loading, notifs, navigate }: any) {
  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Cargando panel...</p>
      </div>
    )
  }

  const promedioPorcentaje = Math.min((data.promedioGeneral / 100) * 100, 100)

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Bienvenida */}
      <div className="iti-gradient text-white rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-1">¡Bienvenido/a, {data.user.name}!</h1>
        <p className="opacity-90">
          {data.user.carrera?.nombre || 'Estudiante'} · Código: {data.user.codigo}
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="iti-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <div className="text-xs text-muted-foreground">Promedio General</div>
            </div>
            <div className="text-2xl font-bold text-primary">{data.promedioGeneral}</div>
            <Progress value={promedioPorcentaje} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
        <Card className="iti-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="h-4 w-4 text-primary" />
              <div className="text-xs text-muted-foreground">Cursos Inscritos</div>
            </div>
            <div className="text-2xl font-bold text-primary">{data.totalCursos}</div>
          </CardContent>
        </Card>
        <Card className="iti-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="h-4 w-4 text-primary" />
              <div className="text-xs text-muted-foreground">Tareas Pendientes</div>
            </div>
            <div className="text-2xl font-bold text-primary">{data.tareasPendientes.length}</div>
          </CardContent>
        </Card>
        <Card className="iti-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Bell className="h-4 w-4 text-primary" />
              <div className="text-xs text-muted-foreground">Notificaciones</div>
            </div>
            <div className="text-2xl font-bold text-primary">{data.notificacionesNoLeidas}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Horario del día */}
        <Card className="iti-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Horario de Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.horarioHoy.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No hay clases hoy.</p>
            ) : (
              <div className="space-y-2">
                {data.horarioHoy.map((h: any) => (
                  <div key={h.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/30">
                    <div className="text-xs font-medium text-primary w-20">
                      {h.horaInicio} - {h.horaFin}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{h.curso}</div>
                      <div className="text-xs text-muted-foreground">Aula: {h.aula}</div>
                    </div>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
            <Button variant="ghost" size="sm" className="w-full mt-3" onClick={() => navigate('horario')}>
              Ver horario completo <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Próximas tareas */}
        <Card className="iti-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" /> Próximas Tareas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.tareasPendientes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No hay tareas pendientes.</p>
            ) : (
              <div className="space-y-2">
                {data.tareasPendientes.slice(0, 5).map((t: any) => (
                  <div key={t.id} className="p-2 rounded-md bg-muted/30">
                    <div className="text-sm font-medium line-clamp-1">{t.titulo}</div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="text-xs text-muted-foreground">{t.curso.nombre}</div>
                      <Badge variant="outline" className="text-[10px]">
                        {new Date(t.fechaEntrega).toLocaleDateString('es-GT')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button variant="ghost" size="sm" className="w-full mt-3" onClick={() => navigate('tareas')}>
              Ver todas las tareas <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Avisos y notificaciones */}
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

      {/* Accesos rápidos */}
      <Card className="iti-card">
        <CardHeader>
          <CardTitle className="text-base">Accesos Rápidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { k: 'notas', l: 'Mis Notas', i: Award },
              { k: 'biblioteca', l: 'Biblioteca', i: Library },
              { k: 'tareas', l: 'Mis Tareas', i: ClipboardList },
              { k: 'horario', l: 'Mi Horario', i: Calendar },
            ].map((a) => (
              <button
                key={a.k}
                onClick={() => navigate(a.k)}
                className="p-4 rounded-lg border border-border bg-card hover:bg-muted/50 hover:border-primary/30 transition text-center"
              >
                <a.i className="h-6 w-6 text-primary mx-auto mb-1" />
                <div className="text-xs font-medium">{a.l}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
