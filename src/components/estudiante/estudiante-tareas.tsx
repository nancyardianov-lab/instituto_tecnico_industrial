'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ClipboardList, Clock, CheckCircle2, AlertCircle, Upload, Send, FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function EstudianteTareas() {
  const { toast } = useToast()
  const [tareas, setTareas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tareaSel, setTareaSel] = useState<any>(null)
  const [entrega, setEntrega] = useState({ comentario: '', archivoUrl: '' })

  const cargar = () => {
    fetch('/api/estudiante/tareas').then(r => r.json()).then(d => {
      setTareas(d.tareas || [])
      setLoading(false)
    })
  }

  useEffect(() => { cargar() }, [])

  const entregar = async () => {
    if (!entrega.comentario && !entrega.archivoUrl) {
      toast({ title: 'Error', description: 'Agregue un comentario o archivo', variant: 'destructive' })
      return
    }
    const res = await fetch(`/api/estudiante/tareas/${tareaSel.id}/entregar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entrega),
    })
    const data = await res.json()
    if (data.ok) {
      toast({ title: 'Tarea entregada', description: 'El docente revisará su entrega.' })
      setTareaSel(null)
      setEntrega({ comentario: '', archivoUrl: '' })
      cargar()
    } else {
      toast({ title: 'Error', description: data.error, variant: 'destructive' })
    }
  }

  const pendientes = tareas.filter(t => !t.entregada)
  const entregadas = tareas.filter(t => t.entregada)

  if (loading) return <p className="text-muted-foreground">Cargando tareas...</p>

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold mb-2">Mis Tareas</h1>
        <p className="text-muted-foreground text-sm">Tareas asignadas en tus cursos.</p>
      </div>

      {/* Pendientes */}
      <div>
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-500" /> Pendientes ({pendientes.length})
        </h2>
        {pendientes.length === 0 ? (
          <Card className="iti-card">
            <CardContent className="p-6 text-center text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-500" />
              <p>¡No tienes tareas pendientes!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {pendientes.map((t) => {
              const vencida = new Date(t.fechaEntrega) < new Date()
              return (
                <Card key={t.id} className={`iti-card ${vencida ? 'border-red-500/40' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm line-clamp-1">{t.titulo}</h3>
                        <div className="text-xs text-muted-foreground mt-0.5">{t.curso} · {t.carrera}</div>
                      </div>
                      <Badge variant={vencida ? 'destructive' : 'outline'} className="text-[10px] flex-shrink-0">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(t.fechaEntrega).toLocaleDateString('es-GT')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{t.descripcion}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px]">Punteo: {t.punteoMaximo}</Badge>
                      <Button size="sm" onClick={() => setTareaSel(t)}>
                        <Upload className="h-3 w-3 mr-1" /> Entregar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Entregadas */}
      <div>
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" /> Entregadas ({entregadas.length})
        </h2>
        <div className="grid md:grid-cols-2 gap-3">
          {entregadas.map((t) => (
            <Card key={t.id} className="iti-card opacity-90">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm line-clamp-1">{t.titulo}</h3>
                    <div className="text-xs text-muted-foreground mt-0.5">{t.curso}</div>
                  </div>
                  {t.entrega?.calificacion !== null && t.entrega?.calificacion !== undefined ? (
                    <Badge className="bg-green-500/15 text-green-700 border-green-500/30">
                      {t.entrega.calificacion}/{t.punteoMaximo}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">En revisión</Badge>
                  )}
                </div>
                {t.entrega?.comentarioDocente && (
                  <div className="bg-muted/30 rounded-md p-2 mt-2">
                    <div className="text-xs font-medium text-primary">Retroalimentación del docente:</div>
                    <p className="text-xs text-muted-foreground mt-1">{t.entrega.comentarioDocente}</p>
                  </div>
                )}
                <Button size="sm" variant="ghost" className="mt-2 w-full" onClick={() => setTareaSel(t)}>
                  Ver detalle
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Modal de entrega */}
      <Dialog open={!!tareaSel} onOpenChange={(o) => !o && setTareaSel(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {tareaSel && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" /> {tareaSel.titulo}
                </DialogTitle>
                <div className="text-sm text-muted-foreground">
                  {tareaSel.curso} · {tareaSel.carrera}
                </div>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    <Clock className="h-3 w-3 mr-1" />
                    Entrega: {new Date(tareaSel.fechaEntrega).toLocaleString('es-GT')}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">Punteo: {tareaSel.punteoMaximo}</Badge>
                </div>

                <div>
                  <div className="font-medium text-sm mb-1">Descripción:</div>
                  <div className="bg-muted/30 rounded-md p-3 text-sm whitespace-pre-wrap">
                    {tareaSel.descripcion}
                  </div>
                </div>

                {tareaSel.entregada && tareaSel.entrega && (
                  <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-md p-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400 mb-2">
                      <CheckCircle2 className="h-4 w-4" /> Entregado el {new Date(tareaSel.entrega.fechaEntrega).toLocaleString('es-GT')}
                    </div>
                    {tareaSel.entrega.comentario && (
                      <p className="text-xs text-muted-foreground">Tu comentario: {tareaSel.entrega.comentario}</p>
                    )}
                    {tareaSel.entrega.calificacion !== null && tareaSel.entrega.calificacion !== undefined && (
                      <div className="mt-2">
                        <div className="text-xs text-muted-foreground">Calificación:</div>
                        <div className="text-lg font-bold text-green-700">{tareaSel.entrega.calificacion}/{tareaSel.punteoMaximo}</div>
                        {tareaSel.entrega.comentarioDocente && (
                          <p className="text-xs mt-1"><strong>Retroalimentación:</strong> {tareaSel.entrega.comentarioDocente}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {!tareaSel.entregada && (
                  <div className="space-y-3 border-t pt-3">
                    <h4 className="font-medium text-sm">Realizar entrega</h4>
                    <div>
                      <Label htmlFor="archivo">Archivo (URL)</Label>
                      <Input
                        id="archivo"
                        value={entrega.archivoUrl}
                        onChange={(e) => setEntrega({ ...entrega, archivoUrl: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="comentario">Comentario</Label>
                      <Textarea
                        id="comentario"
                        rows={3}
                        value={entrega.comentario}
                        onChange={(e) => setEntrega({ ...entrega, comentario: e.target.value })}
                        placeholder="Escribe un comentario para tu entrega..."
                      />
                    </div>
                    <Button onClick={entregar} className="w-full bg-primary hover:bg-primary/90">
                      <Send className="h-4 w-4 mr-2" /> Entregar tarea
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
