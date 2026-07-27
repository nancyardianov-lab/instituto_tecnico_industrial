'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useToast } from '@/hooks/use-toast'

const TIPO_COLOR: Record<string, string> = {
  GENERAL: 'bg-blue-500/15 text-blue-700 border-blue-500/30',
  SISTEMA: 'bg-purple-500/15 text-purple-700 border-purple-500/30',
  INSCRIPCION: 'bg-green-500/15 text-green-700 border-green-500/30',
  TAREA: 'bg-amber-500/15 text-amber-700 border-amber-500/30',
  NOTA: 'bg-indigo-500/15 text-indigo-700 border-indigo-500/30',
}

export function NotificacionesBell() {
  const { toast } = useToast()
  const [notifs, setNotifs] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const prevCount = useRef(0)

  const cargar = async (silencioso = true) => {
    if (!silencioso) setLoading(true)
    try {
      const res = await fetch('/api/notificaciones')
      const d = await res.json()
      const nuevas = d.notificaciones || []
      // Detectar nuevas notificaciones (comparar con previas)
      if (prevCount.current > 0 && nuevas.length > prevCount.current) {
        const diff = nuevas.length - prevCount.current
        const ultima = nuevas[0]
        toast({
          title: `Tienes ${diff} nueva(s) notificación(es)`,
          description: ultima?.titulo ? `Última: ${ultima.titulo}` : undefined,
        })
      }
      prevCount.current = nuevas.length
      setNotifs(nuevas)
    } catch (e) {
      // Silencioso
    } finally {
      if (!silencioso) setLoading(false)
    }
  }

  useEffect(() => {
    cargar(false)
    // Refrescar cada 30 segundos para detectar nuevas notificaciones
    const interval = setInterval(() => cargar(true), 30000)
    return () => clearInterval(interval)
  }, [])

  const noLeidas = notifs.filter(n =>
    n.destinatarios?.length === 0 || (n.destinatarios?.length > 0 && !n.destinatarios[0]?.leida)
  ).length

  const marcarLeida = async (id: string) => {
    try {
      await fetch('/api/notificaciones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificacionId: id }),
      })
      cargar(true)
    } catch (e) {
      // ok
    }
  }

  const marcarTodasLeidas = async () => {
    for (const n of notifs) {
      const leida = n.destinatarios?.length > 0 && n.destinatarios[0]?.leida
      if (!leida) await marcarLeida(n.id)
    }
    toast({ title: 'Notificaciones marcadas como leídas' })
  }

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) cargar(true) }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative p-2 rounded-full">
          <Bell className="h-5 w-5" />
          {noLeidas > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
              {noLeidas > 9 ? '9+' : noLeidas}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Notificaciones</span>
            {noLeidas > 0 && (
              <Badge className="text-[10px] bg-red-500/15 text-red-700">{noLeidas} sin leer</Badge>
            )}
          </div>
          {noLeidas > 0 && (
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={marcarTodasLeidas}>
              <Check className="h-3 w-3 mr-1" /> Marcar todas
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <p className="text-center py-6 text-xs text-muted-foreground">Cargando...</p>
          ) : notifs.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No hay notificaciones</p>
            </div>
          ) : (
            notifs.map((n) => {
              const leida = n.destinatarios?.length > 0 && n.destinatarios[0]?.leida
              return (
                <div
                  key={n.id}
                  className={`p-3 border-b last:border-b-0 hover:bg-muted/30 ${!leida ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="font-medium text-sm flex-1">{n.titulo}</div>
                    <Badge variant="outline" className={`text-[9px] flex-shrink-0 ${TIPO_COLOR[n.tipo] || ''}`}>
                      {n.tipo}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1.5">{n.mensaje}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(n.fechaPublicacion).toLocaleString('es-GT', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                    {!leida && (
                      <button
                        onClick={() => marcarLeida(n.id)}
                        className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                      >
                        <Check className="h-3 w-3" /> Marcar leída
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
