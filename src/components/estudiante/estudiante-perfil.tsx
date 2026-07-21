'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import { User, Mail, Phone, MapPin, Calendar, Save, Lock } from 'lucide-react'

export function EstudiantePerfil() {
  const { user, fetchUser } = useAuthStore()
  const { toast } = useToast()
  const [form, setForm] = useState({
    name: user?.name || '',
    telefono: user?.telefono || '',
    direccion: user?.direccion || '',
    fechaNacimiento: user?.fechaNacimiento ? new Date(user.fechaNacimiento).toISOString().split('T')[0] : '',
    foto: user?.foto || '',
  })
  const [pwForm, setPwForm] = useState({ actual: '', nueva: '', confirmar: '' })
  const [loading, setLoading] = useState(false)

  const guardar = async () => {
    setLoading(true)
    const res = await fetch('/api/perfil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.ok) {
      toast({ title: 'Perfil actualizado' })
      await fetchUser()
    } else {
      toast({ title: 'Error', description: data.error, variant: 'destructive' })
    }
    setLoading(false)
  }

  const cambiarPw = async () => {
    if (pwForm.nueva !== pwForm.confirmar) {
      toast({ title: 'Error', description: 'Las contraseñas no coinciden', variant: 'destructive' })
      return
    }
    if (pwForm.nueva.length < 6) {
      toast({ title: 'Error', description: 'La contraseña debe tener al menos 6 caracteres', variant: 'destructive' })
      return
    }
    const res = await fetch('/api/auth/cambiar-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actual: pwForm.actual, nueva: pwForm.nueva }),
    })
    const data = await res.json()
    if (data.ok) {
      toast({ title: 'Contraseña actualizada' })
      setPwForm({ actual: '', nueva: '', confirmar: '' })
    } else {
      toast({ title: 'Error', description: data.error, variant: 'destructive' })
    }
  }

  if (!user) return null

  return (
    <div className="space-y-6 animate-fadeIn max-w-3xl">
      <h1 className="text-2xl font-bold">Mi Perfil</h1>

      {/* Cabecera de perfil */}
      <Card className="iti-card">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.foto || ''} />
              <AvatarFallback className="text-2xl">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Mail className="h-3 w-3" /> {user.email}
              </div>
              <div className="text-sm text-muted-foreground">Código: {user.codigo}</div>
              {user.carrera && (
                <div className="text-sm text-muted-foreground">Carrera: {user.carrera.nombre}</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datos personales */}
      <Card className="iti-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-5 w-5 text-primary" /> Datos Personales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label>Nombre completo</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="0000-0000" />
            </div>
            <div className="md:col-span-2">
              <Label>Dirección</Label>
              <Input value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
            </div>
            <div>
              <Label>Fecha de nacimiento</Label>
              <Input type="date" value={form.fechaNacimiento} onChange={(e) => setForm({ ...form, fechaNacimiento: e.target.value })} />
            </div>
            <div>
              <Label>Foto (URL)</Label>
              <Input value={form.foto} onChange={(e) => setForm({ ...form, foto: e.target.value })} placeholder="https://..." />
            </div>
          </div>
          <Button onClick={guardar} disabled={loading} className="bg-primary hover:bg-primary/90">
            <Save className="h-4 w-4 mr-2" /> Guardar cambios
          </Button>
        </CardContent>
      </Card>

      {/* Cambiar contraseña */}
      <Card className="iti-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" /> Cambiar Contraseña
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Contraseña actual</Label>
            <Input type="password" value={pwForm.actual} onChange={(e) => setPwForm({ ...pwForm, actual: e.target.value })} />
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label>Nueva contraseña</Label>
              <Input type="password" value={pwForm.nueva} onChange={(e) => setPwForm({ ...pwForm, nueva: e.target.value })} />
            </div>
            <div>
              <Label>Confirmar</Label>
              <Input type="password" value={pwForm.confirmar} onChange={(e) => setPwForm({ ...pwForm, confirmar: e.target.value })} />
            </div>
          </div>
          <Button onClick={cambiarPw} variant="outline">
            <Lock className="h-4 w-4 mr-2" /> Cambiar contraseña
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
