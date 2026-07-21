'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, User } from 'lucide-react'

export function EstudianteHorario() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/estudiante/horario').then(r => r.json()).then(d => {
      setData(d)
      setLoading(false)
    })
  }, [])

  if (loading) return <p className="text-muted-foreground">Cargando horario...</p>
  if (!data) return <p className="text-muted-foreground">Error.</p>

  const { horarioPorDia, dias } = data

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold mb-2">Mi Horario</h1>
        <p className="text-muted-foreground text-sm">Horario semanal de clases.</p>
      </div>

      <div className="grid md:grid-cols-5 gap-3">
        {dias.map((dia: string) => {
          const clases = horarioPorDia[dia] || []
          return (
            <Card key={dia} className="iti-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="capitalize">{dia.charAt(0) + dia.slice(1).toLowerCase()}</span>
                  <Badge variant="outline" className="text-[10px]">{clases.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {clases.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Sin clases</p>
                ) : (
                  clases.map((c: any) => (
                    <div key={c.id} className="border rounded-md p-2 bg-muted/20">
                      <div className="font-medium text-xs mb-1 line-clamp-1">{c.curso}</div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
                        <Clock className="h-3 w-3" /> {c.horaInicio} - {c.horaFin}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {c.aula || 'Sin aula'}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                        <User className="h-3 w-3" /> {c.docente}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="iti-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" /> Resumen Semanal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 rounded-md bg-muted/30">
              <div className="text-2xl font-bold text-primary">
                {Object.values(horarioPorDia).reduce((a: number, b: any) => a + b.length, 0)}
              </div>
              <div className="text-xs text-muted-foreground">Clases totales</div>
            </div>
            <div className="text-center p-3 rounded-md bg-muted/30">
              <div className="text-2xl font-bold text-primary">{dias.length}</div>
              <div className="text-xs text-muted-foreground">Días con clases</div>
            </div>
            <div className="text-center p-3 rounded-md bg-muted/30">
              <div className="text-2xl font-bold text-primary">
                {new Set(Object.values(horarioPorDia).flat().map((c: any) => c.curso)).size}
              </div>
              <div className="text-xs text-muted-foreground">Cursos diferentes</div>
            </div>
            <div className="text-center p-3 rounded-md bg-muted/30">
              <div className="text-2xl font-bold text-primary">
                {Object.values(horarioPorDia).reduce((a: number, b: any) => {
                  const horas = b.reduce((s: number, c: any) => {
                    const [hi, mi] = c.horaInicio.split(':').map(Number)
                    const [hf, mf] = c.horaFin.split(':').map(Number)
                    return s + (hf * 60 + mf - hi * 60 - mi) / 60
                  }, 0)
                  return a + horas
                }, 0).toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground">Horas semanales</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
