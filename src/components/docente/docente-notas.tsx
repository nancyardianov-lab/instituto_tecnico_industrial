'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Award, Save, BookOpen } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function DocenteNotas() {
  const { toast } = useToast()
  const [cursos, setCursos] = useState<any[]>([])
  const [cursoSel, setCursoSel] = useState<string>('')
  const [estudiantes, setEstudiantes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/docente/cursos').then(r => r.json()).then(d => {
      setCursos(d.cursos || [])
      setLoading(false)
      if (d.cursos?.length > 0) setCursoSel(d.cursos[0].id)
    })
  }, [])

  useEffect(() => {
    if (cursoSel) cargarEstudiantes()
  }, [cursoSel])

  const cargarEstudiantes = async () => {
    const res = await fetch(`/api/docente/notas?cursoId=${cursoSel}`)
    const data = await res.json()
    setEstudiantes(data.estudiantes || [])
  }

  const guardarNota = async (estudianteId: string, unidad: number, nota: string, observaciones: string) => {
    if (!nota) return
    const res = await fetch('/api/docente/notas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estudianteId,
        cursoId: cursoSel,
        unidad,
        nota: parseFloat(nota),
        observaciones,
        publicada: true,
      }),
    })
    const data = await res.json()
    if (data.ok) {
      toast({ title: 'Nota guardada y publicada' })
      cargarEstudiantes()
    } else {
      toast({ title: 'Error', description: data.error, variant: 'destructive' })
    }
  }

  if (loading) return <p className="text-muted-foreground">Cargando...</p>

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold mb-2">Registro de Notas</h1>
        <p className="text-muted-foreground text-sm">Registre y publique las calificaciones de sus cursos.</p>
      </div>

      <Card className="iti-card">
        <CardHeader>
          <CardTitle className="text-base">Seleccionar Curso</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={cursoSel} onValueChange={setCursoSel}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {cursos.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.nombre} - {c.anio}° año ({c.carrera})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {cursoSel && estudiantes.length > 0 && (
        <Card className="iti-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" /> Calificaciones por Estudiante
            </CardTitle>
            <CardDescription>
              Las notas se publican automáticamente al guardar. Nota mínima de aprobación: 60.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="text-left p-2">Estudiante</th>
                  <th className="text-center p-2 w-24">Unidad 1</th>
                  <th className="text-center p-2 w-24">Unidad 2</th>
                  <th className="text-center p-2 w-24">Unidad 3</th>
                  <th className="text-center p-2 w-24">Unidad 4</th>
                  <th className="text-center p-2 w-24">Promedio</th>
                  <th className="p-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {estudiantes.map((est) => (
                  <FilaNota key={est.estudianteId} estudiante={est} guardar={guardarNota} />
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function FilaNota({ estudiante, guardar }: any) {
  const [notas, setNotas] = useState<Record<number, string>>({})
  const [obs, setObs] = useState<Record<number, string>>({})

  useEffect(() => {
    const n: Record<number, string> = {}
    const o: Record<number, string> = {}
    ;[1, 2, 3, 4].forEach((u) => {
      const c = estudiante.calificaciones.find((x: any) => x.unidad === u)
      if (c) {
        n[u] = c.nota.toString()
        o[u] = c.observaciones || ''
      }
    })
    setNotas(n)
    setObs(o)
  }, [estudiante])

  const promedio = Object.values(notas).filter(Boolean).length > 0
    ? Object.values(notas).filter(Boolean).reduce((a: any, b: any) => a + parseFloat(b), 0) / Object.values(notas).filter(Boolean).length
    : 0

  return (
    <>
      <tr className="border-b hover:bg-muted/10">
        <td className="p-2">
          <div className="font-medium text-sm">{estudiante.nombre}</div>
          <div className="text-xs text-muted-foreground">{estudiante.codigo}</div>
        </td>
        {[1, 2, 3, 4].map((u) => (
          <td key={u} className="p-1 text-center">
            <Input
              type="number"
              min="0"
              max="100"
              value={notas[u] || ''}
              onChange={(e) => setNotas({ ...notas, [u]: e.target.value })}
              className="w-20 mx-auto text-center"
              placeholder="—"
            />
          </td>
        ))}
        <td className="p-2 text-center">
          <Badge className={promedio >= 60 ? 'bg-green-500/15 text-green-700' : 'bg-red-500/15 text-red-700'}>
            {Math.round(promedio)}
          </Badge>
        </td>
        <td className="p-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              ;[1, 2, 3, 4].forEach((u) => {
                if (notas[u]) guardar(estudiante.estudianteId, u, notas[u], obs[u] || '')
              })
            }}
          >
            <Save className="h-4 w-4" />
          </Button>
        </td>
      </tr>
    </>
  )
}
