'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, User, BookOpen } from 'lucide-react'
import { Timetable, entriesFromHorarioPorDia } from '../shared/timetable'

export function EstudianteHorario() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/estudiante/horario').then(r => r.json()).then(d => {
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

  const { horarioPorDia, dias, carrera, anio } = data

  const totalClases = Object.values(horarioPorDia).reduce((a: number, b: any) => a + b.length, 0)
  const cursosUnicos = new Set(Object.values(horarioPorDia).flat().map((c: any) => c.curso))
  const diasConClases = dias.filter((d: string) => (horarioPorDia[d] || []).length > 0).length

  const entries = entriesFromHorarioPorDia(horarioPorDia)
  const headerInfo = carrera
    ? `${carrera.nombre} · ${anio}° año`
    : anio
      ? `${anio}° año`
      : undefined

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold mb-2">Mi Horario</h1>
        <p className="text-muted-foreground text-sm">
          Horario semanal de tus clases. Solo ves las materias en las que estás inscrito.
        </p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="iti-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{totalClases}</div>
            <div className="text-xs text-muted-foreground">Clases semanales</div>
          </CardContent>
        </Card>
        <Card className="iti-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{cursosUnicos.size}</div>
            <div className="text-xs text-muted-foreground">Materias diferentes</div>
          </CardContent>
        </Card>
        <Card className="iti-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{diasConClases}</div>
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

      {/* Timetable */}
      <Timetable
        entries={entries}
        title="Horario Semanal"
        subtitle="Vista semanal de tus materias inscritas"
        showDocente={true}
        showAula={true}
        headerInfo={headerInfo}
      />

      {totalClases === 0 && (
        <Card className="iti-card border-amber-300 bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="p-4 text-sm text-amber-800 dark:text-amber-200">
            <p>
              No tienes clases en tu horario todavía. Ve a <strong>"Inscripción a Materias"</strong> en el menú lateral
              para inscribirte en las materias de tu carrera y año.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
