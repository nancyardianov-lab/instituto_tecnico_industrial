'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, BookOpen, Users, GraduationCap } from 'lucide-react'

export function DocenteHorario() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/docente/horario').then(r => r.json()).then(d => {
      setData(d)
      setLoading(false)
    })
  }, [])

  if (loading) return <p className="text-muted-foreground">Cargando horario...</p>
  if (!data) return <p className="text-muted-foreground">Error.</p>

  const { horarioPorDia, dias, cursosAsignados, totalCursos } = data

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold mb-2">Mi Horario</h1>
        <p className="text-muted-foreground text-sm">
          Horario semanal de las clases que impartes. Los cursos, grados y carreras son asignados por el administrador.
        </p>
      </div>

      {/* Resumen */}
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
              <div className="text-2xl font-bold text-primary">{totalCursos}</div>
              <div className="text-xs text-muted-foreground">Cursos asignados</div>
            </div>
            <div className="text-center p-3 rounded-md bg-muted/30">
              <div className="text-2xl font-bold text-primary">
                {dias.filter((d: string) => (horarioPorDia[d] || []).length > 0).length}
              </div>
              <div className="text-xs text-muted-foreground">Días con clases</div>
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

      {/* Horario por día */}
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
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
                        <MapPin className="h-3 w-3" /> {c.aula || 'Sin aula'}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <GraduationCap className="h-3 w-3" /> {c.carrera} · {c.anio}°
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Cursos asignados */}
      <Card className="iti-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> Cursos Asignados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cursosAsignados.length === 0 ? (
            <div className="text-center py-6">
              <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Aún no tiene cursos asignados. El administrador le asignará los cursos,
                grados y carreras que impartirá.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {cursosAsignados.map((c: any) => (
                <div key={c.id} className="border rounded-md p-3 bg-muted/20">
                  <div className="font-semibold text-sm mb-1">{c.nombre}</div>
                  <div className="text-xs text-muted-foreground mb-2">{c.carrera}</div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{c.anio}° año</Badge>
                    <Badge variant="outline" className="text-[10px]">
                      <Users className="h-3 w-3 mr-1" /> {c.totalEstudiantes} est.
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
