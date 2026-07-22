'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouterStore, useAuthStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import { Loader2, LogIn, UserPlus, GraduationCap, Shield, BookOpen, Mail, ChevronDown, ChevronUp } from 'lucide-react'

export function LoginView() {
  const { setPath } = useRouterStore()
  const { fetchUser, setUser } = useAuthStore()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [showDocente, setShowDocente] = useState(false)
  const [docenteForm, setDocenteForm] = useState({
    name: '', email: '', telefono: '',
  })

  const handleLogin = async (email?: string, password?: string) => {
    const creds = email && password ? { email, password } : loginForm
    if (!creds.email || !creds.password) {
      toast({ title: 'Error', description: 'Email y contraseña son requeridos', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds),
      })
      const data = await res.json()
      if (data.ok) {
        // 1) Set user immediately from login response so the router can decide
        //    the right panel without waiting for /api/auth/me
        setUser(data.user)
        toast({ title: 'Bienvenido/a', description: `Sesión iniciada como ${data.user.role.toLowerCase()}` })

        // 2) Navigate to the corresponding panel based on role
        const role = data.user.role
        if (role === 'ADMIN') setPath('/admin')
        else if (role === 'DOCENTE') setPath('/docente')
        else setPath('/estudiante')

        // 3) Refresh with the full profile (carrera, estudiante, docente) in background
        fetchUser()
      } else {
        toast({ title: 'Error de acceso', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'No se pudo iniciar sesión', variant: 'destructive' })
    }
    setLoading(false)
  }

  const handleDocenteRegister = async () => {
    const required = ['name', 'email']
    for (const f of required) {
      if (!docenteForm[f as keyof typeof docenteForm]) {
        toast({ title: 'Error', description: 'Nombre y email son obligatorios', variant: 'destructive' })
        return
      }
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register-docente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docenteForm),
      })
      const data = await res.json()
      if (data.ok) {
        toast({ title: 'Solicitud enviada', description: data.message })
        setDocenteForm({ name: '', email: '', telefono: '' })
        setShowDocente(false)
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'No se pudo enviar la solicitud', variant: 'destructive' })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10 bg-gradient-to-br from-muted/40 to-primary/5 animate-fadeIn">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-6">
        {/* Columna informativa */}
        <div className="hidden md:flex flex-col justify-center p-6 iti-gradient text-white rounded-lg">
          <div className="mb-6">
            <img src="/institucional/logo.jpeg" alt="ITI" className="h-20 w-20 rounded-full object-cover ring-4 ring-accent/50 bg-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Instituto Técnico Industrial</h2>
          <p className="opacity-90 mb-6 italic">"Solo la calidad nos hace competitivos"</p>
          
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <GraduationCap className="h-5 w-5 text-accent mt-0.5" />
              <div>
                <div className="font-medium">Estudiantes</div>
                <div className="text-sm opacity-80">Acceso a notas, tareas, biblioteca y horarios.</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <BookOpen className="h-5 w-5 text-accent mt-0.5" />
              <div>
                <div className="font-medium">Docentes</div>
                <div className="text-sm opacity-80">Gestión de cursos, tareas, calificaciones y biblioteca.</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="h-5 w-5 text-accent mt-0.5" />
              <div>
                <div className="font-medium">Administradores</div>
                <div className="text-sm opacity-80">Control total: usuarios, contenido, plantillas, reportes.</div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/20 text-xs opacity-80">
            <p>
              Las cuentas de estudiantes y docentes se crean a través del proceso de
              preinscripción o solicitud, y son activadas por el administrador.
            </p>
          </div>
        </div>

        {/* Columna de login */}
        <div className="space-y-4">
          {/* Formulario de login */}
          <Card className="iti-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogIn className="h-5 w-5 text-primary" /> Acceso al sistema
              </CardTitle>
              <CardDescription>Ingrese su correo y contraseña para iniciar sesión</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  placeholder="correo@iti.edu.gt"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              <div>
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="••••••••"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              <Button
                onClick={() => handleLogin()}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                Iniciar sesión
              </Button>

              <div className="text-xs text-center text-muted-foreground">
                ¿No tiene cuenta?{' '}
                <button onClick={() => setPath('/')} className="text-primary hover:underline">
                  Preinscribirse
                </button>
              </div>

              {/* Solicitud docente - minimizada */}
              <div className="pt-2 border-t">
                <button
                  onClick={() => setShowDocente(!showDocente)}
                  className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-primary transition py-2"
                >
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3 w-3" />
                    ¿Es docente? Solicite una cuenta
                  </span>
                  {showDocente ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>

                {showDocente && (
                  <div className="mt-2 p-3 bg-muted/30 rounded-md space-y-3 animate-fadeIn">
                    <p className="text-xs text-muted-foreground">
                      Complete el formulario. El administrador revisará su solicitud y, si es aprobada,
                      recibirá un correo con instrucciones para activar su cuenta. El administrador le asignará
                      posteriormente los cursos, grados y carreras que impartirá.
                    </p>
                    <div>
                      <Label htmlFor="d-name" className="text-xs">Nombre completo *</Label>
                      <Input
                        id="d-name"
                        value={docenteForm.name}
                        onChange={(e) => setDocenteForm({ ...docenteForm, name: e.target.value })}
                        placeholder="Prof. Nombre Apellido"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="d-email" className="text-xs">Correo electrónico *</Label>
                      <Input
                        id="d-email"
                        type="email"
                        value={docenteForm.email}
                        onChange={(e) => setDocenteForm({ ...docenteForm, email: e.target.value })}
                        placeholder="correo@ejemplo.com"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="d-tel" className="text-xs">Teléfono</Label>
                      <Input
                        id="d-tel"
                        value={docenteForm.telefono}
                        onChange={(e) => setDocenteForm({ ...docenteForm, telefono: e.target.value })}
                        placeholder="0000-0000"
                        className="h-9 text-sm"
                      />
                    </div>
                    <Button
                      onClick={handleDocenteRegister}
                      disabled={loading}
                      size="sm"
                      variant="outline"
                      className="w-full"
                    >
                      {loading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <UserPlus className="mr-2 h-3 w-3" />}
                      Enviar solicitud
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
