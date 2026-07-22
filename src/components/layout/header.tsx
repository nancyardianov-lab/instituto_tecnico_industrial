'use client'

import { useState, useEffect } from 'react'
import { Menu, X, Sun, Moon, LogOut, User, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useTheme } from 'next-themes'
import { useAuthStore, useRouterStore } from '@/lib/store'
import { Badge } from '@/components/ui/badge'
import { NotificacionesBell } from '../shared/notificaciones-bell'

const PUBLIC_NAV = [
  { label: 'Inicio', path: '/' },
  { label: 'Carreras', path: '/carreras' },
  { label: 'Preinscripción', path: '/preinscripcion' },
  { label: 'Contacto', path: '/contacto' },
]

export function Header() {
  const [open, setOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { user, logout } = useAuthStore()
  const { path, setPath } = useRouterStore()

  useEffect(() => setMounted(true), [])

  const navigate = (p: string) => {
    setPath(p)
    setOpen(false)
  }

  const dashboardPath = user
    ? user.role === 'ADMIN'
      ? '/admin'
      : user.role === 'DOCENTE'
      ? '/docente'
      : '/estudiante'
    : null

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <img
              src="/institucional/logo.jpeg"
              alt="Logo ITI"
              className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/30"
            />
            <div className="hidden md:block text-left">
              <div className="text-sm font-bold leading-tight text-primary">
                Instituto Técnico Industrial
              </div>
              <div className="text-[10px] text-muted-foreground leading-tight">
                San Pedro Sacatepéquez, San Marcos
              </div>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {PUBLIC_NAV.map((item) => (
              <Button
                key={item.path}
                variant={path === item.path ? 'default' : 'ghost'}
                size="sm"
                onClick={() => navigate(item.path)}
                className={path === item.path ? 'bg-primary text-primary-foreground' : ''}
              >
                {item.label}
              </Button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Cambiar tema"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            )}

            {user && <NotificacionesBell />}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.foto || ''} alt={user.name} />
                      <AvatarFallback>
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <div className="text-xs font-medium leading-tight">{user.name}</div>
                      <div className="text-[10px] text-muted-foreground leading-tight">
                        {user.role === 'ADMIN' ? 'Administrador' : user.role === 'DOCENTE' ? 'Docente' : 'Estudiante'}
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                      <Badge variant="outline" className="mt-1 text-[10px]">
                        {user.role === 'ADMIN' ? 'Administrador' : user.role === 'DOCENTE' ? 'Docente' : 'Estudiante'}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(dashboardPath!)}>
                    <User className="mr-2 h-4 w-4" /> Mi Panel
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      logout()
                      navigate('/')
                    }}
                    className="text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate('/login')}
                className="bg-primary hover:bg-primary/90"
              >
                Iniciar sesión
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setOpen(!open)}
              aria-label="Menú"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {open && (
          <div className="md:hidden py-3 border-t border-border">
            <nav className="flex flex-col gap-1">
              {PUBLIC_NAV.map((item) => (
                <Button
                  key={item.path}
                  variant={path === item.path ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className="justify-start"
                >
                  {item.label}
                </Button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
