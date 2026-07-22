'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, Check, X, Lock, Unlock, Key, UserCheck, UserX, Filter, Mail, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function AdminUsuarios() {
  const { toast } = useToast()
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('TODOS')
  const [status, setStatus] = useState('TODOS')
  const [modal, setModal] = useState<{ user: any; action: string } | null>(null)
  const [notas, setNotas] = useState('')

  const cargar = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (role !== 'TODOS') params.set('role', role)
    if (status !== 'TODOS') params.set('status', status)
    fetch(`/api/admin/usuarios?${params.toString()}`).then(r => r.json()).then(d => {
      setUsuarios(d.usuarios || [])
      setLoading(false)
    })
  }

  useEffect(() => { cargar() }, [search, role, status])

  const ejecutarAccion = async () => {
    if (!modal) return
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: modal.user.id, action: modal.action, notas }),
      })
      const data = await res.json()
      if (data.ok) {
        // El usuario se actualizó correctamente.
        // Si el correo falló pero el usuario sí se actualizó, avisamos al admin.
        if (data.emailSent === false) {
          toast({
            title: 'Usuario actualizado (correo falló)',
            description: `Se actualizó el usuario, pero el correo no se pudo enviar: ${data.emailError || 'error desconocido'}. Puede reenviar desde el panel.`,
            variant: 'destructive',
          })
        } else {
          toast({ title: 'Acción ejecutada', description: `Usuario ${modal.user.name} actualizado.` })
        }
        setModal(null)
        setNotas('')
        cargar()
      } else {
        toast({
          title: 'Error',
          description: data.detalle || data.error || 'Error desconocido',
          variant: 'destructive',
        })
      }
    } catch (e: any) {
      toast({
        title: 'Error de red',
        description: e?.message || 'No se pudo conectar con el servidor',
        variant: 'destructive',
      })
    }
  }

  const ACTIONS = [
    { key: 'aprobar_docente', label: 'Aprobar docente', icon: UserCheck, color: 'bg-green-500', needsNotes: false },
    { key: 'rechazar_docente', label: 'Rechazar docente', icon: UserX, color: 'bg-red-500', needsNotes: true },
    { key: 'bloquear', label: 'Bloquear', icon: Lock, color: 'bg-red-500', needsNotes: false },
    { key: 'activar', label: 'Activar', icon: Unlock, color: 'bg-green-500', needsNotes: false },
    { key: 'restablecer_password', label: 'Restablecer contraseña', icon: Key, color: 'bg-amber-500', needsNotes: false },
  ]

  const eliminarUsuario = async (u: any) => {
    if (!confirm(`¿Eliminar definitivamente al usuario "${u.name}" (${u.email})?\n\nEsta acción NO se puede deshacer. Se borrarán:\n- Su cuenta y datos asociados\n- Sus calificaciones, tareas, entregas\n- Sus libros subidos a la biblioteca\n- Sus comentarios y favoritos`)) return
    try {
      const res = await fetch(`/api/admin/usuarios?userId=${u.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.ok) {
        toast({ title: 'Usuario eliminado', description: `${u.name} fue eliminado del sistema` })
        cargar()
      } else {
        toast({ title: 'Error', description: data.error || data.detalle || 'No se pudo eliminar', variant: 'destructive' })
      }
    } catch (e: any) {
      toast({ title: 'Error de red', description: e?.message || 'No se pudo conectar', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold mb-2">Gestión de Usuarios</h1>
        <p className="text-muted-foreground text-sm">Administre usuarios, aprobaciones, bloqueos y contraseñas.</p>
      </div>

      {/* Filtros */}
      <Card className="iti-card">
        <CardContent className="p-4">
          <div className="grid md:grid-cols-4 gap-3">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /><Filter className="h-3 w-3" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos los roles</SelectItem>
                <SelectItem value="ADMIN">Administradores</SelectItem>
                <SelectItem value="DOCENTE">Docentes</SelectItem>
                <SelectItem value="ESTUDIANTE">Estudiantes</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos los estados</SelectItem>
                <SelectItem value="ACTIVO">Activos</SelectItem>
                <SelectItem value="PENDIENTE">Pendientes</SelectItem>
                <SelectItem value="ACEPTADO">Aceptados (espera activación)</SelectItem>
                <SelectItem value="BLOQUEADO">Bloqueados</SelectItem>
                <SelectItem value="RECHAZADO">Rechazados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Listado */}
      <Card className="iti-card">
        <CardHeader>
          <CardTitle className="text-base">Usuarios ({usuarios.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="text-left p-2">Usuario</th>
                  <th className="text-left p-2">Rol</th>
                  <th className="text-left p-2">Estado</th>
                  <th className="text-left p-2">Carrera</th>
                  <th className="text-left p-2">Registro</th>
                  <th className="text-center p-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No hay usuarios con estos filtros.</td></tr>
                ) : (
                  usuarios.map((u) => (
                    <tr key={u.id} className="border-b hover:bg-muted/10">
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={u.foto || ''} />
                            <AvatarFallback className="text-xs">{u.name.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{u.name}</div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                            <div className="text-xs text-muted-foreground">Código: {u.codigo || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge variant="outline" className="text-[10px]">{u.role}</Badge>
                      </td>
                      <td className="p-2">
                        <Badge className={`text-[10px] ${
                          u.status === 'ACTIVO' ? 'bg-green-500/15 text-green-700 border-green-500/30'
                          : u.status === 'PENDIENTE' ? 'bg-amber-500/15 text-amber-700 border-amber-500/30'
                          : u.status === 'BLOQUEADO' ? 'bg-red-500/15 text-red-700 border-red-500/30'
                          : u.status === 'RECHAZADO' ? 'bg-red-500/15 text-red-700 border-red-500/30'
                          : u.status === 'ACEPTADO' ? 'bg-blue-500/15 text-blue-700 border-blue-500/30'
                          : 'bg-muted/30'
                        }`}>{u.status}</Badge>
                      </td>
                      <td className="p-2 text-xs">{u.carrera?.nombre || '—'}</td>
                      <td className="p-2 text-xs text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString('es-GT')}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1 justify-center flex-wrap">
                          {u.role === 'DOCENTE' && u.status === 'PENDIENTE' && (
                            <>
                              <Button size="sm" variant="ghost" className="h-7 text-green-600 hover:bg-green-50"
                                onClick={() => setModal({ user: u, action: 'aprobar_docente' })}>
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-red-600 hover:bg-red-50"
                                onClick={() => setModal({ user: u, action: 'rechazar_docente' })}>
                                <X className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                          {u.status === 'ACTIVO' && (
                            <Button size="sm" variant="ghost" className="h-7 text-red-600 hover:bg-red-50"
                              onClick={() => setModal({ user: u, action: 'bloquear' })}>
                              <Lock className="h-3 w-3" />
                            </Button>
                          )}
                          {u.status === 'BLOQUEADO' && (
                            <Button size="sm" variant="ghost" className="h-7 text-green-600 hover:bg-green-50"
                              onClick={() => setModal({ user: u, action: 'activar' })}>
                              <Unlock className="h-3 w-3" />
                            </Button>
                          )}
                          {u.status === 'ACEPTADO' && (
                            <Button size="sm" variant="ghost" className="h-7 text-blue-600 hover:bg-blue-50"
                              onClick={() => setModal({ user: u, action: 'reenviar_activacion' })}
                              title="Reenviar correo de activación">
                              <Mail className="h-3 w-3" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 text-amber-600 hover:bg-amber-50"
                            onClick={() => setModal({ user: u, action: 'restablecer_password' })}>
                            <Key className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-red-600 hover:bg-red-50"
                            onClick={() => eliminarUsuario(u)}
                            title="Eliminar usuario">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de confirmación */}
      <Dialog open={!!modal} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar acción</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm">
              ¿Está seguro de ejecutar <strong>{modal?.action.replace(/_/g, ' ')}</strong> sobre el usuario{' '}
              <strong>{modal?.user.name}</strong> ({modal?.user.email})?
            </p>
            {modal?.action === 'rechazar_docente' && (
              <div>
                <Label>Motivo del rechazo *</Label>
                <Textarea
                  rows={3}
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Indique el motivo..."
                />
              </div>
            )}
            {modal?.action === 'aprobar_docente' && (
              <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded text-xs text-blue-800 dark:text-blue-200">
                Se generará un token de activación y se enviará un correo al docente con instrucciones para crear su contraseña.
              </div>
            )}
            {modal?.action === 'reenviar_activacion' && (
              <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded text-xs text-blue-800 dark:text-blue-200">
                Se generará un nuevo enlace de activación (válido 48 horas) y se enviará al correo del usuario.
                Útil si el usuario perdió el correo original o el enlace expiró.
              </div>
            )}
            {modal?.action === 'restablecer_password' && (
              <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded text-xs text-amber-800 dark:text-amber-200">
                Se enviará al usuario un correo con un enlace para crear una nueva contraseña.
                La contraseña actual quedará invalidada hasta que el usuario cree la nueva.
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setModal(null)}>Cancelar</Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={ejecutarAccion}>Confirmar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
