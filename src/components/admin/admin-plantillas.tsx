'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Mail, Save } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function AdminPlantillas() {
  const { toast } = useToast()
  const [plantillas, setPlantillas] = useState<any[]>([])
  const [sel, setSel] = useState<any>(null)
  const [form, setForm] = useState<any>(null)

  const cargar = () => {
    fetch('/api/admin/plantillas').then(r => r.json()).then(d => setPlantillas(d.plantillas || []))
  }
  useEffect(() => { cargar() }, [])

  const editar = (p: any) => {
    setSel(p)
    setForm({ ...p })
  }

  const guardar = async () => {
    const res = await fetch('/api/admin/plantillas', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.ok) {
      toast({ title: 'Plantilla actualizada' })
      cargar()
    } else {
      toast({ title: 'Error', description: data.error, variant: 'destructive' })
    }
  }

  if (sel && form) {
    return (
      <div className="space-y-4 animate-fadeIn">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" size="sm" onClick={() => setSel(null)} className="mb-2">← Volver</Button>
            <h1 className="text-2xl font-bold">Editar: {sel.tipo.replace(/_/g, ' ')}</h1>
          </div>
          <Button onClick={guardar} className="bg-primary hover:bg-primary/90"><Save className="h-4 w-4 mr-2" /> Guardar</Button>
        </div>

        <Card className="iti-card">
          <CardContent className="space-y-3 p-4">
            <div>
              <Label>Asunto del correo</Label>
              <Input value={form.asunto} onChange={(e) => setForm({ ...form, asunto: e.target.value })} />
            </div>
            <div>
              <Label>Contenido</Label>
              <Textarea
                rows={12}
                value={form.contenido}
                onChange={(e) => setForm({ ...form, contenido: e.target.value })}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Variables disponibles: {'{{estudianteNombre}}, {{carreraNombre}}, {{estudianteCodigo}}, {{fechaInscripcion}}, {{enlaceActivacion}}, {{enlaceRestablecimiento}}, {{notasRevision}}, {{tareaTitulo}}, {{cursoNombre}}, {{fechaEntrega}}, {{punteoMaximo}}, {{unidad}}, {{nota}}, {{nombre}}'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Logo institucional (URL)</Label>
                <Input value={form.logoUrl || ''} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} />
              </div>
              <div>
                <Label>Fecha límite</Label>
                <Input value={form.fechaLimite || ''} onChange={(e) => setForm({ ...form, fechaLimite: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Firma</Label>
              <Textarea rows={3} value={form.firma || ''} onChange={(e) => setForm({ ...form, firma: e.target.value })} />
            </div>
            <div>
              <Label>Documentos solicitados (JSON)</Label>
              <Textarea rows={3} value={form.documentosSolicitados || ''} onChange={(e) => setForm({ ...form, documentosSolicitados: e.target.value })} className="font-mono text-xs" />
            </div>
            <div>
              <Label>Información de contacto</Label>
              <Input value={form.informacionContacto || ''} onChange={(e) => setForm({ ...form, informacionContacto: e.target.value })} />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold mb-2">Plantillas de Correo</h1>
        <p className="text-muted-foreground text-sm">
          Personalice el contenido de los correos automáticos del sistema. Los cambios se aplican inmediatamente.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {plantillas.map((p) => (
          <Card key={p.id} className="iti-card cursor-pointer hover:border-primary/40" onClick={() => editar(p)}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{p.tipo.replace(/_/g, ' ')}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{p.asunto}</div>
                  <Badge variant="outline" className="text-[10px] mt-1">
                    {p.contenido.length} caracteres
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
