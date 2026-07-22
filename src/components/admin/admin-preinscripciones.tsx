'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Check, X, Clock, FileCheck, FileX, AlertTriangle, Calendar, Mail, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const STATUS_INFO: Record<string, any> = {
  PENDIENTE: { label: 'Pendiente', color: 'bg-amber-500/15 text-amber-700 border-amber-500/30', icon: Clock },
  ACEPTADA: { label: 'Aceptada', color: 'bg-green-500/15 text-green-700 border-green-500/30', icon: Check },
  DOCUMENTACION_INCOMPLETA: { label: 'Doc. Incompleta', color: 'bg-orange-500/15 text-orange-700 border-orange-500/30', icon: AlertTriangle },
  RECHAZADA: { label: 'Rechazada', color: 'bg-red-500/15 text-red-700 border-red-500/30', icon: X },
  INSCRIPCION_CONFIRMADA: { label: 'Inscrito', color: 'bg-blue-500/15 text-blue-700 border-blue-500/30', icon: FileCheck },
}

export function AdminPreinscripciones() {
  const { toast } = useToast()
  const [preinscripciones, setPreinscripciones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('TODOS')
  const [sel, setSel] = useState<any>(null)
  const [notas, setNotas] = useState('')
  const [fechaInscripcion, setFechaInscripcion] = useState('')

  const cargar = () => {
    const params = new URLSearchParams()
    if (status !== 'TODOS') params.set('status', status)
    fetch(`/api/preinscripciones?${params.toString()}`).then(r => r.json()).then(d => {
      setPreinscripciones(d.preinscripciones || [])
      setLoading(false)
    })
  }

  useEffect(() => { cargar() }, [status])

  const eliminar = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar la preinscripción de "${nombre}"?\n\nEsta acción no se puede deshacer. Si la preinscripción ya tenía un usuario creado, ese usuario seguirá existiendo y deberá eliminarse desde Gestión de Usuarios.`)) return
    try {
      const res = await fetch(`/api/preinscripciones/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.ok) {
        toast({ title: 'Preinscripción eliminada' })
        cargar()
      } else {
        toast({ title: 'Error', description: data.error || data.detalle || 'No se pudo eliminar', variant: 'destructive' })
      }
    } catch (e: any) {
      toast({ title: 'Error de red', description: e?.message || 'No se pudo conectar', variant: 'destructive' })
    }
  }

  const cambiarEstado = async (id: string, newStatus: string) => {
    const res = await fetch(`/api/preinscripciones/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: newStatus,
        notasRevision: notas,
        fechaInscripcionPresencial: fechaInscripcion || undefined,
      }),
    })
    const data = await res.json()
    if (data.ok) {
      toast({ title: 'Estado actualizado', description: `Preinscripción: ${newStatus}` })
      setSel(null)
      setNotas('')
      setFechaInscripcion('')
      cargar()
    } else {
      toast({ title: 'Error', description: data.error, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold mb-2">Preinscripciones</h1>
        <p className="text-muted-foreground text-sm">Revise y administre las solicitudes de preinscripción.</p>
      </div>

      {/* Filtro */}
      <Card className="iti-card">
        <CardContent className="p-4">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos los estados</SelectItem>
              <SelectItem value="PENDIENTE">Pendientes</SelectItem>
              <SelectItem value="ACEPTADA">Aceptadas</SelectItem>
              <SelectItem value="DOCUMENTACION_INCOMPLETA">Documentación incompleta</SelectItem>
              <SelectItem value="INSCRIPCION_CONFIRMADA">Inscripción confirmada</SelectItem>
              <SelectItem value="RECHAZADA">Rechazadas</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Listado */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {preinscripciones.length === 0 ? (
          <Card className="iti-card md:col-span-3">
            <CardContent className="p-8 text-center text-muted-foreground">
              No hay preinscripciones con este filtro.
            </CardContent>
          </Card>
        ) : (
          preinscripciones.map((p) => {
            const info = STATUS_INFO[p.status] || STATUS_INFO.PENDIENTE
            return (
              <Card key={p.id} className="iti-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">{p.estudianteNombre}</h3>
                      <div className="text-xs text-muted-foreground">Código: {p.estudianteCodigo}</div>
                    </div>
                    <Badge className={`text-[10px] ${info.color}`}>
                      <info.icon className="h-3 w-3 mr-1" />
                      {info.label}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground mb-3">
                    <div><strong>Carrera:</strong> {p.carreraNombre}</div>
                    <div><strong>Estudiante:</strong> {p.estudianteEmail}</div>
                    <div><strong>Padre/Encargado:</strong> {p.padreNombre}</div>
                    <div><strong>Solicitud:</strong> {new Date(p.createdAt).toLocaleDateString('es-GT')}</div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => { setSel(p); setNotas(p.notasRevision || '') }}>
                      Revisar
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => eliminar(p.id, p.estudianteNombre)} title="Eliminar">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Modal de revisión */}
      <Dialog open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {sel && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Revisión de Preinscripción
                  <Badge className={`text-[10px] ${STATUS_INFO[sel.status].color}`}>{STATUS_INFO[sel.status].label}</Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Datos del estudiante */}
                <div className="bg-muted/30 rounded-md p-3">
                  <h4 className="font-medium text-sm mb-2">Datos del Estudiante</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><strong>Nombre:</strong> {sel.estudianteNombre}</div>
                    <div><strong>Código:</strong> {sel.estudianteCodigo}</div>
                    <div><strong>Email:</strong> {sel.estudianteEmail}</div>
                    <div><strong>Teléfono:</strong> {sel.estudianteTelefono}</div>
                    <div className="col-span-2"><strong>Carrera:</strong> {sel.carreraNombre}</div>
                  </div>
                </div>

                {/* Datos del padre */}
                <div className="bg-muted/30 rounded-md p-3">
                  <h4 className="font-medium text-sm mb-2">Datos del Padre/Encargado</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><strong>Nombre:</strong> {sel.padreNombre}</div>
                    <div><strong>Teléfono:</strong> {sel.padreTelefono}</div>
                    <div className="col-span-2"><strong>Email:</strong> {sel.padreEmail}</div>
                  </div>
                </div>

                {/* Estado actual */}
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-md p-3 text-xs text-blue-800 dark:text-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="h-4 w-4" />
                    <strong>Flujo del proceso:</strong>
                  </div>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>PENDIENTE → Revisión inicial</li>
                    <li>ACEPTADA → Correo con documentos requeridos</li>
                    <li>INSCRIPCION_CONFIRMADA → Correo con enlace de activación</li>
                    <li>El estudiante activa su cuenta y crea contraseña</li>
                    <li>El estudiante puede iniciar sesión</li>
                  </ol>
                </div>

                {/* Notas de revisión */}
                <div>
                  <Label>Notas de revisión (visible para el estudiante)</Label>
                  <Textarea
                    rows={2}
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Notas internas o motivo del cambio..."
                  />
                </div>

                {/* Fecha inscripción presencial */}
                {sel.status === 'PENDIENTE' && (
                  <div>
                    <Label>Fecha sugerida para inscripción presencial (opcional)</Label>
                    <Input
                      type="datetime-local"
                      value={fechaInscripcion}
                      onChange={(e) => setFechaInscripcion(e.target.value)}
                    />
                  </div>
                )}

                {/* Botones de acción según estado */}
                <div className="border-t pt-3">
                  <Label className="block mb-2">Acciones:</Label>
                  {sel.status === 'PENDIENTE' && (
                    <div className="grid grid-cols-2 gap-2">
                      <Button className="bg-green-600 hover:bg-green-700" onClick={() => cambiarEstado(sel.id, 'ACEPTADA')}>
                        <Check className="h-4 w-4 mr-1" /> Aceptar
                      </Button>
                      <Button variant="outline" className="border-orange-500 text-orange-600" onClick={() => cambiarEstado(sel.id, 'DOCUMENTACION_INCOMPLETA')}>
                        <AlertTriangle className="h-4 w-4 mr-1" /> Doc. Incompleta
                      </Button>
                      <Button variant="destructive" className="col-span-2" onClick={() => cambiarEstado(sel.id, 'RECHAZADA')}>
                        <X className="h-4 w-4 mr-1" /> Rechazar
                      </Button>
                    </div>
                  )}
                  {sel.status === 'ACEPTADA' && (
                    <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => cambiarEstado(sel.id, 'INSCRIPCION_CONFIRMADA')}>
                      <FileCheck className="h-4 w-4 mr-1" /> Confirmar inscripción presencial
                    </Button>
                  )}
                  {sel.status === 'DOCUMENTACION_INCOMPLETA' && (
                    <div className="grid grid-cols-2 gap-2">
                      <Button className="bg-green-600 hover:bg-green-700" onClick={() => cambiarEstado(sel.id, 'ACEPTADA')}>
                        <Check className="h-4 w-4 mr-1" /> Aceptar ahora
                      </Button>
                      <Button variant="destructive" onClick={() => cambiarEstado(sel.id, 'RECHAZADA')}>
                        <X className="h-4 w-4 mr-1" /> Rechazar
                      </Button>
                    </div>
                  )}
                  {sel.status === 'INSCRIPCION_CONFIRMADA' && (
                    <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded text-xs text-green-800 dark:text-green-200 text-center">
                      <FileCheck className="h-6 w-6 mx-auto mb-1 text-green-600" />
                      <p>El estudiante ha sido inscrito. Se ha enviado correo con enlace de activación de cuenta.</p>
                      <p className="mt-1"><strong>Usuario creado:</strong> {sel.estudianteEmail}</p>
                    </div>
                  )}
                  {sel.status === 'RECHAZADA' && (
                    <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded text-xs text-red-800 dark:text-red-200 text-center">
                      <X className="h-6 w-6 mx-auto mb-1 text-red-600" />
                      <p>Solicitud rechazada. Se envió correo al estudiante y padre.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
