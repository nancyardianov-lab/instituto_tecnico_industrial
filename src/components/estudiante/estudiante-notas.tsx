'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Award, TrendingUp, BookOpen } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

export function EstudianteNotas() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/estudiante/notas').then(r => r.json()).then(d => {
      setData(d)
      setLoading(false)
    })
  }, [])

  if (loading) return <p className="text-muted-foreground">Cargando notas...</p>
  if (!data) return <p className="text-muted-foreground">Error al cargar notas.</p>

  // Datos para gráficos
  const chartData = data.porCurso.map((p: any) => ({
    name: p.curso.nombre.length > 20 ? p.curso.nombre.substring(0, 20) + '...' : p.curso.nombre,
    promedio: Math.round(p.promedio),
  }))

  // Datos para radar (unidades)
  const unidades = [1, 2, 3, 4]
  const radarData = unidades.map((u) => {
    const notas = data.historial.filter((h: any) => h.unidad === u && h.publicada)
    const promedio = notas.length > 0 ? notas.reduce((s: number, n: any) => s + n.nota, 0) / notas.length : 0
    return { unidad: `Unidad ${u}`, promedio: Math.round(promedio) }
  })

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="iti-card border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <div className="text-xs text-muted-foreground">Promedio General</div>
            </div>
            <div className="text-3xl font-bold text-primary">{data.promedioGeneral}</div>
          </CardContent>
        </Card>
        <Card className="iti-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="h-4 w-4 text-primary" />
              <div className="text-xs text-muted-foreground">Cursos Inscritos</div>
            </div>
            <div className="text-3xl font-bold text-primary">{data.porCurso.length}</div>
          </CardContent>
        </Card>
        <Card className="iti-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Award className="h-4 w-4 text-primary" />
              <div className="text-xs text-muted-foreground">Total Calificaciones</div>
            </div>
            <div className="text-3xl font-bold text-primary">{data.historial.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de barras - Promedio por curso */}
      <Card className="iti-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" /> Promedio por Curso
          </CardTitle>
          <CardDescription>Comparativo del rendimiento académico por curso</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Aún no hay calificaciones publicadas.</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="promedio" fill="oklch(0.32 0.13 255)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Radar - rendimiento por unidad */}
      <Card className="iti-card">
        <CardHeader>
          <CardTitle className="text-base">Rendimiento por Unidad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="unidad" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar dataKey="promedio" stroke="oklch(0.32 0.13 255)" fill="oklch(0.32 0.13 255)" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detalle por curso */}
      <Card className="iti-card">
        <CardHeader>
          <CardTitle className="text-base">Detalle por Curso</CardTitle>
          <CardDescription>Calificaciones por unidad y promedio final</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.porCurso.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No hay calificaciones registradas.</p>
          ) : (
            data.porCurso.map((p: any, idx: number) => (
              <div key={idx} className="border rounded-md p-3 bg-muted/20">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-semibold text-sm">{p.curso.nombre}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.curso.anio}° año · {p.curso.carrera?.nombre}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{Math.round(p.promedio)}</div>
                    <div className="text-xs text-muted-foreground">Promedio</div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((u) => {
                    const nota = p.notas.find((n: any) => n.unidad === u)
                    return (
                      <div key={u} className="text-center p-2 rounded bg-background border">
                        <div className="text-xs text-muted-foreground">Unidad {u}</div>
                        <div className={`font-bold ${nota ? (nota.nota >= 60 ? 'text-green-600' : 'text-red-600') : 'text-muted-foreground/40'}`}>
                          {nota ? nota.nota : '—'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
