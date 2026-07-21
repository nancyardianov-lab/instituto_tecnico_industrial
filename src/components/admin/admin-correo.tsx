'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Mail, Send, CheckCircle2, AlertCircle, Loader2, Server, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function AdminCorreo() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [info, setInfo] = useState<any>(null)
  const [verificando, setVerificando] = useState(false)
  const [probando, setProbando] = useState(false)
  const [destino, setDestino] = useState('')

  const cargar = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/correo')
      const data = await res.json()
      setInfo(data)
    } catch {
      toast({ title: 'Error', description: 'No se pudo cargar la información', variant: 'destructive' })
    }
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  const verificar = async () => {
    setVerificando(true)
    try {
      const res = await fetch('/api/admin/correo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'verificar' }),
      })
      const data = await res.json()
      if (data.ok) {
        toast({
          title: 'Conexión exitosa',
          description: 'El servidor SMTP respondió correctamente. Los correos se enviarán sin problema.',
        })
      } else {
        toast({
          title: 'No se pudo conectar',
          description: data.error || 'Revise las variables EMAIL_* en .env',
          variant: 'destructive',
        })
      }
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e?.message || 'No se pudo verificar',
        variant: 'destructive',
      })
    }
    setVerificando(false)
  }

  const probar = async () => {
    if (!destino) {
      toast({ title: 'Error', description: 'Ingrese un correo de destino', variant: 'destructive' })
      return
    }
    setProbando(true)
    try {
      const res = await fetch('/api/admin/correo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'probar', destino }),
      })
      const data = await res.json()
      if (data.ok) {
        toast({
          title: 'Correo enviado',
          description: `Se envió un correo de prueba a ${destino}. Revisa la bandeja de entrada.`,
        })
        cargar()
      } else {
        toast({
          title: 'Fallo el envío',
          description: data.error || 'Error desconocido',
          variant: 'destructive',
        })
      }
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e?.message || 'No se pudo enviar',
        variant: 'destructive',
      })
    }
    setProbando(false)
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Mail className="h-6 w-6 text-primary" /> Correo del Instituto
        </h1>
        <p className="text-muted-foreground text-sm">
          Configure y pruebe el correo institucional desde el cual el sistema envía los correos
          automáticos (confirmaciones de preinscripción, activación de cuenta, notificaciones, etc.).
        </p>
      </div>

      {/* Estado de configuración */}
      <Card className="iti-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" /> Estado del servidor SMTP
          </CardTitle>
          <CardDescription>
            Las credenciales se configuran en el archivo <code className="bg-muted px-1 rounded">.env</code> del proyecto
            (variables <code className="bg-muted px-1 rounded">EMAIL_HOST</code>,
            <code className="bg-muted px-1 rounded ml-1">EMAIL_USER</code>,
            <code className="bg-muted px-1 rounded ml-1">EMAIL_PASSWORD</code>, etc.).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-md bg-muted/30">
              <div className="text-xs text-muted-foreground">Estado</div>
              {info?.configurado ? (
                <Badge className="bg-green-100 text-green-700 mt-1"><CheckCircle2 className="h-3 w-3 mr-1" />Configurado</Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-700 mt-1"><AlertCircle className="h-3 w-3 mr-1" />Sin configurar</Badge>
              )}
            </div>
            <div className="p-3 rounded-md bg-muted/30">
              <div className="text-xs text-muted-foreground">Remitente</div>
              <div className="text-sm font-medium truncate">{info?.from || '—'}</div>
            </div>
            <div className="p-3 rounded-md bg-muted/30">
              <div className="text-xs text-muted-foreground">Servidor</div>
              <div className="text-sm font-medium truncate">{info?.host || '—'}</div>
            </div>
            <div className="p-3 rounded-md bg-muted/30">
              <div className="text-xs text-muted-foreground">Puerto</div>
              <div className="text-sm font-medium">{info?.port || '—'}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={verificar} disabled={verificando || !info?.configurado}>
              {verificando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Verificar conexión
            </Button>
            <Button onClick={cargar} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
            </Button>
          </div>

          {!info?.configurado && (
            <div className="p-4 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              <strong>Aún no se ha configurado el correo.</strong> Mientras tanto, los correos
              automáticos se <em>registran</em> en el historial de abajo, pero no se envían realmente
              a las bandejas de los destinatarios. Una vez que se agreguen las credenciales en
              <code className="bg-amber-100 px-1 mx-1 rounded">.env</code> y se reinicie el servidor,
              todos los correos pendientes y nuevos se enviarán de verdad.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Envío de correo de prueba */}
      <Card className="iti-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" /> Enviar correo de prueba
          </CardTitle>
          <CardDescription>
            Verifique que el correo llegue correctamente a la bandeja de entrada (y no a spam).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="destino">Correo destino</Label>
            <Input
              id="destino"
              type="email"
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              placeholder="correo@ejemplo.com"
            />
          </div>
          <Button onClick={probar} disabled={probando || !info?.configurado}>
            {probando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Enviar correo de prueba
          </Button>
        </CardContent>
      </Card>

      {/* Historial de correos */}
      <Card className="iti-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" /> Historial de correos ({info?.ultimosCorreos?.length || 0})
          </CardTitle>
          <CardDescription>Últimos 20 correos enviados (o intentados) por el sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {(info?.ultimosCorreos || []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No hay correos en el historial.</p>
            ) : (
              (info?.ultimosCorreos || []).map((c: any) => {
                const fallo = c.asunto?.startsWith('[FALLO]')
                return (
                  <div
                    key={c.id}
                    className={`p-3 rounded-md border-l-2 ${fallo ? 'bg-red-50 border-red-500' : 'bg-muted/30 border-primary'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className={`font-medium text-sm ${fallo ? 'text-red-700' : ''}`}>
                        {fallo ? <AlertCircle className="inline h-3 w-3 mr-1" /> : null}
                        {c.asunto}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {new Date(c.enviadoAt).toLocaleString('es-GT')}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Para: <span className="font-mono">{c.destinatario}</span>
                      {c.destinatarioNombre ? ` (${c.destinatarioNombre})` : ''}
                    </div>
                    <details className="mt-1">
                      <summary className="text-[10px] text-muted-foreground cursor-pointer">Ver contenido</summary>
                      <pre className="text-[10px] text-muted-foreground mt-1 whitespace-pre-wrap font-mono bg-muted/50 p-2 rounded">
                        {c.contenido}
                      </pre>
                    </details>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
