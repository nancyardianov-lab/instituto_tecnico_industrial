'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Bell, Send, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function AdminNotificaciones() {
  const { toast } = useToast()
  const [notifs, setNotifs] = useState<any[]>([])
  const [form, setForm] = useState({
    titulo: '', mensaje: '', tipo: 'GENERAL', esGlobal: true,
  })

  const cargar = () => {
    fetch('/api/notificaciones').then(r => r.json()).then(d => setNotifs(d.notificaciones || []))
  }
  useEffect(() => { cargar() }, [])

  const publicar = async () => {
    if (!form.titulo || !form.mensaje) {
      toast({ title: 'Error', description: 'Título y mensaje son requeridos', variant: 'destructive' })
      return
    }
    const res = await fetch('/api/notificaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.ok) {
      toast({ title: 'Notificación publicada', description: form.esGlobal ? 'Enviada a todos los usuarios' : 'Enviada a destinatarios seleccionados' })
      setForm({ titulo: '', mensaje: '', tipo: 'GENERAL', esGlobal: true })
      cargar()
    } else {
      toast({ title: 'Error', description: data.error || 'No se pudo publicar', variant: 'destructive' })
    }
  }

  const eliminar = async (id: string, titulo: string) => {
    if (!confirm(`¿Eliminar la notificación "${titulo}"?\n\nSe borrará para todos los usuarios.`)) return
    const res = await fetch('/api/notificaciones', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificacionId: id, accion: 'eliminar' }),
    })
    const data = await res.json()
    if (data.ok) {
      toast({ title: 'Notificación eliminada' })
      cargar()
    } else {
      toast({ title: 'Error', description: data.error || 'No se pudo eliminar', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold mb-2">Notificaciones</h1>
        <p className="text-muted-foreground text-sm">Publicar avisos generales para todos los usuarios.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="iti-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" /> Nueva Notificación
            </CardTitle>
            <CardDescription>Se enviará a todos los usuarios activos del sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Título</Label>
              <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            </div>
            <div>
              <Label>Mensaje</Label>
              <Textarea rows={4} value={form.mensaje} onChange={(e) => setForm({ ...form, mensaje: e.target.value })} />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL">General</SelectItem>
                  <SelectItem value="SISTEMA">Sistema</SelectItem>
                  <SelectItem value="INSCRIPCION">Inscripción</SelectItem>
                  <SelectItem value="TAREA">Tarea</SelectItem>
                  <SelectItem value="NOTA">Nota</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.esGlobal} onCheckedChange={(c) => setForm({ ...form, esGlobal: c })} />
              <Label>Notificación global (todos los usuarios)</Label>
            </div>
            <Button onClick={publicar} className="w-full bg-primary hover:bg-primary/90">
              <Send className="h-4 w-4 mr-2" /> Publicar notificación
            </Button>
          </CardContent>
        </Card>

        <Card className="iti-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" /> Historial ({notifs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {notifs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No hay notificaciones.</p>
              ) : (
                notifs.map((n) => (
                  <div key={n.id} className="p-3 rounded-md bg-muted/30 border-l-2 border-primary group">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-sm flex-1">{n.titulo}</div>
                      <div className="flex items-center gap-2">
                        {n.esGlobal && <Badge className="text-[10px] bg-primary/15 text-primary">Global</Badge>}
                        <button
                          onClick={() => eliminar(n.id, n.titulo)}
                          className="opacity-0 group-hover:opacity-100 transition text-destructive hover:bg-destructive/10 rounded p-1"
                          title="Eliminar notificación"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{n.mensaje}</p>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {new Date(n.fechaPublicacion).toLocaleString('es-GT')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
