'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, Users, ClipboardList, ChevronDown, ChevronUp, User } from 'lucide-react'

export function DocenteCursos() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [expandido, setExpandido] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/docente/cursos').then(r => r.json()).then(d => {
      setData(d)
      setLoading(false)
    })
  }, [])

  if (loading) return <p className="text-muted-foreground">Cargando cursos...</p>
  if (!data) return <p className="text-muted-foreground">Error.</p>

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold mb-2">Mis Cursos</h1>
        <p className="text-muted-foreground text-sm">Cursos asignados por el administrador.</p>
      </div>

      {data.cursos.length === 0 ? (
        <Card className="iti-card">
          <CardContent className="p-8 text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>No tiene cursos asignados todavía.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.cursos.map((c: any) => (
            <Card key={c.id} className="iti-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{c.nombre}</CardTitle>
                    <CardDescription>{c.carrera}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{c.anio}° año</Badge>
                    <Badge variant="outline"><Users className="h-3 w-3 mr-1" />{c.estudiantes.length}</Badge>
                    <Badge variant="outline"><ClipboardList className="h-3 w-3 mr-1" />{c.tareas.length}</Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setExpandido(expandido === c.id ? null : c.id)}
                    >
                      {expandido === c.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {expandido === c.id && (
                <CardContent className="border-t pt-4">
                  {/* Pensum */}
                  <div className="mb-4">
                    <h4 className="font-medium text-sm mb-2">Pensum del curso</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="border-b">
                          <tr className="text-left text-muted-foreground">
                            <th className="py-1.5 pr-3">Área / Asignatura</th>
                            <th className="py-1.5 pr-3">Subárea</th>
                            <th className="py-1.5 text-right">Periodos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {c.pensum.map((p: any, i: number) => (
                            <tr key={i} className="border-b border-border/40">
                              <td className="py-1.5 pr-3 font-medium">{p.area}</td>
                              <td className="py-1.5 pr-3 text-muted-foreground">{p.subarea || '—'}</td>
                              <td className="py-1.5 text-right">{p.periodos}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Estudiantes */}
                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" /> Estudiantes Inscritos ({c.estudiantes.length})
                    </h4>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {c.estudiantes.map((e: any) => (
                        <div key={e.id} className="border rounded-md p-2 bg-muted/20 text-sm">
                          <div className="font-medium">{e.nombre}</div>
                          <div className="text-xs text-muted-foreground">{e.codigo}</div>
                          <div className="text-xs text-muted-foreground">{e.email}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
