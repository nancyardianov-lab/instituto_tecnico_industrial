'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, BookOpen, Users, GraduationCap } from 'lucide-react'
import { Timetable, entriesFromHorarioPorDia } from '../shared/timetable'

export function DocenteHorario() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/docente/horario').then(r => r.json()).then(d => {
      setData(d)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Clock className="h-5 w-5 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Cargando horario...</span>
      </div>
    )
  }
  if (!data) return <p className="text-muted-foreground">Error al cargar el horario.</p>

  const { horarioPorDia, dias, cursosAsignados, totalCursos } = data

  const entries = entriesFromHorarioPorDia(horarioPorDia)

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold mb-2">Mi Horario</h1>
        <p className="text-muted-foreground text-sm">
          Horario semanal de las clases que impartes. Los cursos, grados y carreras son asignados por el administrador.
        </p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="iti-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {Object.values(horarioPorDia).reduce((a: number, b: any) => a + b.length, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Clases totales</div>
          </CardContent>
        </Card>
        <Card className="iti-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{totalCursos}</div>
            <div className="text-xs text-muted-foreground">Materias asignadas</div>
          </CardContent>
        </Card>
        <Card className="iti-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {dias.filter((d: string) => (horarioPorDia[d] || []).length > 0).length}
            </div>
            <div className="text-xs text-muted-foreground">Días con clases</div>
          </CardContent>
        </Card>
        <Card className="iti-card">
          <CardContent className="p-4 text-center">
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
          </CardContent>
        </Card>
      </div>

      {/* Timetable semanal */}
      <Timetable
        entries={entries}
        title="Horario Semanal de Clases"
        subtitle="Vista semanal de las materias que impartes"
        showCarrera={true}
        showDocente={false}
        showAula={true}
        showGrado={true}
      />

      {/* Materias asignadas */}
      <Card className="iti-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> Materias Asignadas ({cursosAsignados.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cursosAsignados.length === 0 ? (
            <div className="text-center py-6">
              <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Aún no tiene materias asignadas. El administrador le asignará las materias,
                años y carreras que impartirá.
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
