'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useRouterStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle2, AlertCircle, Loader2, User, Phone, Mail, GraduationCap, FileText, Clock, ListChecks } from 'lucide-react'

export function PreinscripcionView() {
  const { setPath } = useRouterStore()
  const { toast } = useToast()
  const [carreras, setCarreras] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<any>(null)
  const [form, setForm] = useState({
    padreNombre: '', padreTelefono: '', padreEmail: '',
    estudianteNombre: '', estudianteCodigo: '', estudianteTelefono: '', estudianteEmail: '',
    carreraId: '',
  })

  useEffect(() => {
    fetch('/api/carreras').then(r => r.json()).then(data => setCarreras(data.carreras || []))
  }, [])

  const submit = async () => {
    // Validación
    const required = ['padreNombre', 'padreTelefono', 'padreEmail', 'estudianteNombre', 'estudianteCodigo', 'estudianteTelefono', 'estudianteEmail', 'carreraId']
    for (const f of required) {
      if (!form[f as keyof typeof form]) {
        toast({ title: 'Error', description: 'Complete todos los campos obligatorios', variant: 'destructive' })
        return
      }
    }
    if (!/^\S+@\S+\.\S+$/.test(form.padreEmail) || !/^\S+@\S+\.\S+$/.test(form.estudianteEmail)) {
      toast({ title: 'Error', description: 'Correos electrónicos inválidos', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/preinscripciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.ok) {
        setSuccess(data)
        toast({ title: 'Solicitud enviada', description: 'Se ha enviado un correo de confirmación.' })
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudo enviar la solicitud', variant: 'destructive' })
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-3xl animate-fadeIn">
        <Card className="iti-card border-green-500/40">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-green-700">¡Solicitud enviada con éxito!</h1>
            <p className="text-muted-foreground mb-6">
              Su solicitud de preinscripción ha sido registrada en el sistema. Se ha enviado un correo electrónico
              al estudiante y al padre/encargado confirmando la recepción.
            </p>

            <div className="bg-muted/30 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> ¿Qué sigue?
              </h3>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Su solicitud será revisada por el equipo administrativo del instituto.</li>
                <li>Recibirá una notificación por correo cuando el estado cambie.</li>
                <li>Si la preinscripción es <strong>aceptada</strong>, deberá presentarse presencialmente con la documentación requerida.</li>
                <li>Una vez confirmada la inscripción presencial, recibirá un correo con instrucciones para <strong>activar su cuenta</strong> y crear su contraseña.</li>
                <li>Podrá iniciar sesión y acceder a su panel de estudiante.</li>
              </ol>
            </div>

            <div className="bg-primary/5 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-sm mb-2">Datos registrados</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Estudiante</div>
                  <div className="font-medium">{success.preinscripcion.estudianteNombre}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Código</div>
                  <div className="font-medium">{success.preinscripcion.estudianteCodigo}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-muted-foreground">Carrera solicitada</div>
                  <div className="font-medium">{success.preinscripcion.carreraNombre}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Estado actual</div>
                  <Badge className="bg-yellow-500/15 text-yellow-700 border-yellow-500/30">PENDIENTE</Badge>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button onClick={() => setPath('/')} variant="outline">Volver al inicio</Button>
              <Button onClick={() => { setSuccess(null); setForm({ padreNombre: '', padreTelefono: '', padreEmail: '', estudianteNombre: '', estudianteCodigo: '', estudianteTelefono: '', estudianteEmail: '', carreraId: '' }) }}>
                Enviar otra solicitud
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="animate-fadeIn">
      {/* Hero */}
      <section className="iti-gradient text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <GraduationCap className="h-12 w-12 mx-auto mb-2" />
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Preinscripción en línea</h1>
          <p className="opacity-90 max-w-2xl mx-auto">
            Complete el formulario para iniciar el proceso de inscripción al Instituto Técnico Industrial.
            Recibirá un correo confirmando la recepción de su solicitud.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Pasos del proceso */}
          <div className="md:col-span-1">
            <Card className="iti-card sticky top-20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ListChecks className="h-5 w-5 text-primary" /> Proceso de Preinscripción
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 text-sm">
                  {[
                    { n: 1, t: 'Formulario en línea', d: 'Complete y envíe el formulario.' },
                    { n: 2, t: 'Revisión administrativa', d: 'El administrador revisa su solicitud.' },
                    { n: 3, t: 'Notificación', d: 'Recibe el resultado por correo.' },
                    { n: 4, t: 'Inscripción presencial', d: 'Si fue aceptado, presente la documentación.' },
                    { n: 5, t: 'Activación de cuenta', d: 'Cree su contraseña y acceda al sistema.' },
                  ].map((p) => (
                    <li key={p.n} className="flex gap-3">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                        {p.n}
                      </div>
                      <div>
                        <div className="font-medium">{p.t}</div>
                        <div className="text-xs text-muted-foreground">{p.d}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>

          {/* Formulario */}
          <div className="md:col-span-2">
            <Card className="iti-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" /> Formulario de Preinscripción
                </CardTitle>
                <CardDescription>Todos los campos son obligatorios</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Datos del padre */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 pb-2 border-b flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" /> Datos del Padre o Encargado
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="padreNombre">Nombre completo *</Label>
                      <Input
                        id="padreNombre"
                        value={form.padreNombre}
                        onChange={(e) => setForm({ ...form, padreNombre: e.target.value })}
                        placeholder="Nombre y apellidos"
                      />
                    </div>
                    <div>
                      <Label htmlFor="padreTelefono">Teléfono *</Label>
                      <Input
                        id="padreTelefono"
                        value={form.padreTelefono}
                        onChange={(e) => setForm({ ...form, padreTelefono: e.target.value })}
                        placeholder="0000-0000"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="padreEmail">Correo electrónico *</Label>
                      <Input
                        id="padreEmail"
                        type="email"
                        value={form.padreEmail}
                        onChange={(e) => setForm({ ...form, padreEmail: e.target.value })}
                        placeholder="correo@ejemplo.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Datos del estudiante */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 pb-2 border-b flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-primary" /> Datos del Estudiante
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="md:col-span-2">
                      <Label htmlFor="estudianteNombre">Nombre completo *</Label>
                      <Input
                        id="estudianteNombre"
                        value={form.estudianteNombre}
                        onChange={(e) => setForm({ ...form, estudianteNombre: e.target.value })}
                        placeholder="Nombre y apellidos"
                      />
                    </div>
                    <div>
                      <Label htmlFor="estudianteCodigo">Código del estudiante *</Label>
                      <Input
                        id="estudianteCodigo"
                        value={form.estudianteCodigo}
                        onChange={(e) => setForm({ ...form, estudianteCodigo: e.target.value })}
                        placeholder="Ej: EST-2025-001"
                      />
                    </div>
                    <div>
                      <Label htmlFor="estudianteTelefono">Teléfono *</Label>
                      <Input
                        id="estudianteTelefono"
                        value={form.estudianteTelefono}
                        onChange={(e) => setForm({ ...form, estudianteTelefono: e.target.value })}
                        placeholder="0000-0000"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="estudianteEmail">Correo electrónico *</Label>
                      <Input
                        id="estudianteEmail"
                        type="email"
                        value={form.estudianteEmail}
                        onChange={(e) => setForm({ ...form, estudianteEmail: e.target.value })}
                        placeholder="correo@ejemplo.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Carrera */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 pb-2 border-b flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-primary" /> Carrera de Interés
                  </h3>
                  <Label htmlFor="carrera">Seleccione la carrera *</Label>
                  <Select
                    value={form.carreraId}
                    onValueChange={(v) => setForm({ ...form, carreraId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="-- Seleccione una carrera --" />
                    </SelectTrigger>
                    <SelectContent>
                      {carreras.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Aviso */}
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-md p-3 text-sm flex gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-blue-800 dark:text-blue-200">
                    <strong>Importante:</strong> Al enviar este formulario, se guardará su solicitud en nuestra base de datos.
                    Se enviará un correo confirmando la recepción. Deberá esperar la revisión del administrador para continuar con el proceso.
                  </div>
                </div>

                <Button
                  onClick={submit}
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
                    </>
                  ) : (
                    'Enviar solicitud de preinscripción'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
