'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, CheckCircle2, XCircle, Eye, EyeOff, KeyRound, ArrowRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRouterStore } from '@/lib/store'

export function ActivarCuentaView() {
  const { toast } = useToast()
  const { setPath } = useRouterStore()
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [estado, setEstado] = useState<'form' | 'exito' | 'error'>('form')
  const [mensajeError, setMensajeError] = useState('')

  // Extraer el token del hash de la URL: #/activar-cuenta?token=XXX
  useEffect(() => {
    const hash = window.location.hash || ''
    const partes = hash.split('?')
    if (partes.length > 1) {
      const params = new URLSearchParams(partes[1])
      const t = params.get('token')
      if (t) {
        setToken(t)
      } else {
        setEstado('error')
        setMensajeError('No se encontró el token de activación en el enlace.')
      }
    } else {
      setEstado('error')
      setMensajeError('Enlace inválido. Asegúrate de usar el enlace que llegó a tu correo.')
    }
  }, [])

  const activar = async () => {
    if (!token) {
      setEstado('error')
      setMensajeError('Token no encontrado.')
      return
    }
    if (password.length < 6) {
      toast({ title: 'Contraseña muy corta', description: 'Debe tener al menos 6 caracteres', variant: 'destructive' })
      return
    }
    if (password !== confirmar) {
      toast({ title: 'Las contraseñas no coinciden', variant: 'destructive' })
      return
    }

    setCargando(true)
    try {
      const res = await fetch('/api/auth/activar-cuenta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (data.ok) {
        setEstado('exito')
        toast({ title: '¡Cuenta activada!', description: 'Ya puedes iniciar sesión' })
      } else {
        setEstado('error')
        setMensajeError(data.error || 'No se pudo activar la cuenta')
        toast({ title: 'Error', description: data.error || 'No se pudo activar', variant: 'destructive' })
      }
    } catch (e: any) {
      setEstado('error')
      setMensajeError(e?.message || 'Error inesperado')
    } finally {
      setCargando(false)
    }
  }

  // ============ ESTADO: ÉXITO ============
  if (estado === 'exito') {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
        <Card className="iti-card max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-primary">¡Cuenta Activada!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              Tu cuenta ha sido activada correctamente. Ya puedes iniciar sesión con tu correo y la contraseña que acabas de crear.
            </p>
            <Button onClick={() => setPath('/login')} className="w-full bg-primary hover:bg-primary/90">
              Ir a Iniciar Sesión <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ============ ESTADO: ERROR ============
  if (estado === 'error') {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
        <Card className="iti-card max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-destructive">Enlace inválido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">{mensajeError}</p>
            <p className="text-sm text-muted-foreground">
              Si copiaste y pegaste el enlace, asegúrate de incluir el código completo.
              Si el enlace expiró (tiene 48 horas de validez), contacta al instituto para que te envíen uno nuevo.
            </p>
            <Button onClick={() => setPath('/login')} variant="outline" className="w-full">
              Volver al inicio de sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ============ ESTADO: FORMULARIO ============
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <Card className="iti-card max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full iti-gradient flex items-center justify-center">
            <KeyRound className="h-10 w-10 text-accent" />
          </div>
          <CardTitle className="text-2xl text-primary">Activar mi cuenta</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Crea la contraseña que usarás para iniciar sesión en el sistema del Instituto Técnico Industrial.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="h-4 w-4" /> Nueva contraseña
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={mostrar ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                disabled={cargando}
                onKeyDown={(e) => { if (e.key === 'Enter' && password && confirmar) activar() }}
              />
              <button
                type="button"
                onClick={() => setMostrar(!mostrar)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {mostrar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmar" className="flex items-center gap-2">
              <Lock className="h-4 w-4" /> Confirmar contraseña
            </Label>
            <Input
              id="confirmar"
              type={mostrar ? 'text' : 'password'}
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              placeholder="Repite la contraseña"
              disabled={cargando}
              onKeyDown={(e) => { if (e.key === 'Enter' && password && confirmar) activar() }}
            />
          </div>

          {password && confirmar && password !== confirmar && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <XCircle className="h-3 w-3" /> Las contraseñas no coinciden
            </p>
          )}
          {password && confirmar && password === confirmar && password.length >= 6 && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Las contraseñas coinciden
            </p>
          )}

          <div className="bg-muted/30 rounded-md p-3 text-xs text-muted-foreground">
            <p className="font-medium mb-1">Recomendaciones:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Usa al menos 6 caracteres</li>
              <li>Combina letras, números y símbolos</li>
              <li>No uses una contraseña que ya uses en otros sitios</li>
            </ul>
          </div>

          <Button
            onClick={activar}
            disabled={cargando || !password || !confirmar || password !== confirmar || password.length < 6}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {cargando ? 'Activando...' : 'Activar cuenta'}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Si tienes problemas, contacta al instituto: 7760-2670
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
