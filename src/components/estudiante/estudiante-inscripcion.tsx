'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, CheckCircle2, User, Users, Plus, Trash2, Loader2, Info } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/lib/store'

export function EstudianteInscripcion() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState<string | null>(null)

  const cargar = () => {
    setLoading(true)
    fetch('/api/estudiante/inscripciones')
      .then(r => r.json())
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }
  useEffect(() => { cargar() }, [])

  const inscribir = async (cursoId: string, nombre: string) => {
    setProcesando(cursoId)
    try {
      const res = await fetch('/api/estudiante/inscripciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cursoId }),
      })
      const d = await res.json()
      if (d.ok) {
        toast({ title: 'Inscripción exitosa', description: `Te inscribiste en "${nombre}"` })
        cargar()
      } else {
        toast({ title: 'Error', description: d.error, variant: 'destructive' })
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Error inesperado', variant: 'destructive' })
    } finally {
      setProcesando(null)
    }
  }

  const desinscribir = async (cursoId: string, nombre: string) => {
    if (!confirm(`¿Desinscribirte de "${nombre}"?\n\nSe quitará de tu horario. Las notas y tareas ya entregadas NO se borrarán.`)) return
    setProcesando(cursoId)
    try {
      const res = await fetch(`/api/estudiante/inscripciones?cursoId=${cursoId}`, { method: 'DELETE' })
      const d = await res.json()
      if (d.ok) {
        toast({ title: 'Desinscrito', description: `Ya no estás en "${nombre}"` })
        cargar()
      } else {
        toast({ title: 'Error', description: d.error, variant: 'destructive' })
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Error inesperado', variant: 'destructive' })
    } finally {
      setProcesando(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Cargando materias...</span>
      </div>
    )
  }

  if (!data) return <p className="text-muted-foreground">Error al cargar.</p>

  if (data.error && !data.materias?.length) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div>
          <h1 className="text-2xl font-bold mb-2">Inscripción a Materias</h1>
          <p className="text-muted-foreground text-sm">Selecciona las materias que vas a cursar este año.</p>
        </div>
        <Card className="iti-card border-amber-300 bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-amber-800 dark:text-amber-200 mb-1">No hay materias disponibles</div>
                <p className="text-sm text-amber-700 dark:text-amber-300">{data.error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const materias = data.materias || []
  const inscritas = materias.filter((m: any) => m.yaInscrito)
  const disponibles = materias.filter((m: any) => !m.yaInscrito)

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold mb-2">Inscripción a Materias</h1>
        <p className="text-muted-foreground text-sm">
          {data.carrera?.nombre} · {data.anio}° año
        </p>
      </div>

      {/* Banner info */}
      <Card className="iti-card bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">¿Cómo funciona?</p>
              <p>Solo puedes inscribirte en materias de <strong>tu carrera</strong> y <strong>tu año/grado</strong>. Al inscribirte en una materia, se agregará automáticamente a tu horario si ya tiene horas definidas.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Materias inscritas */}
      <Card className="iti-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Materias en las que estoy inscrito ({inscritas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inscritas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aún no estás inscrito en ninguna materia. Revisa la lista de abajo.
            </p>
          ) : (
            <div className="space-y-2">
              {inscritas.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between p-3 border rounded-md bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{m.nombre}</div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><User className="h-3 w-3" /> {m.docente}</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {m.totalInscritos} inscritos</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => desinscribir(m.id, m.nombre)}
                    disabled={procesando === m.id}
                  >
                    {procesando === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Materias disponibles */}
      <Card className="iti-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Materias disponibles para inscribirse ({disponibles.length})
          </CardTitle>
          <CardDescription className="text-xs">
            Materias de {data.carrera?.nombre} · {data.anio}° año. Solo puedes inscribirte en materias que tengan un docente asignado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {disponibles.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay materias adicionales para inscribirse. {inscritas.length > 0 ? 'Ya estás inscrito en todas las disponibles.' : 'El administrador aún no ha creado materias para tu carrera y año.'}
            </p>
          ) : (
            <div className="space-y-2">
              {disponibles.map((m: any) => (
                <div key={m.id} className={`flex items-center justify-between p-3 border rounded-md ${m.tieneDocente ? 'bg-muted/10' : 'bg-muted/5 opacity-60'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{m.nombre}</div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                      <span className="flex items-center gap-1"><User className="h-3 w-3" /> {m.docente}</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {m.totalInscritos} inscritos</span>
                    </div>
                    {m.descripcion && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{m.descripcion}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => inscribir(m.id, m.nombre)}
                    disabled={!m.tieneDocente || procesando === m.id}
                  >
                    {procesando === m.id ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                    Inscribir
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
