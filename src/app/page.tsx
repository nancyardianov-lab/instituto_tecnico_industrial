'use client'

import { useEffect } from 'react'
import { useAuthStore, useRouterStore } from '@/lib/store'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { InicioView } from '@/components/public/inicio-view'
import { CarrerasView } from '@/components/public/carreras-view'
import { PreinscripcionView } from '@/components/public/preinscripcion-view'
import { ContactoView } from '@/components/public/contacto-view'
import { LoginView } from '@/components/public/login-view'
import { ActivarCuentaView } from '@/components/public/activar-cuenta-view'
import { EstudianteLayout } from '@/components/estudiante/estudiante-layout'
import { DocenteLayout } from '@/components/docente/docente-layout'
import { AdminLayout } from '@/components/admin/admin-layout'

export default function Home() {
  const { user, loading, fetchUser } = useAuthStore()
  const { path, setPath, initFromHash } = useRouterStore()

  // Inicializar al montar
  useEffect(() => {
    initFromHash()
    fetchUser()

    // Escuchar cambios en el hash
    const handler = () => {
      initFromHash()
    }
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])

  // Scroll al inicio cuando cambia la ruta
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [path])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full iti-gradient flex items-center justify-center">
            <img src="/institucional/logo.jpeg" alt="ITI" className="h-12 w-12 rounded-full object-cover bg-white" />
          </div>
          <p className="text-sm text-muted-foreground">Cargando Instituto Técnico Industrial...</p>
        </div>
      </div>
    )
  }

  // Determinar vista
  const parts = path.split('/').filter(Boolean)
  // El root puede venir con query string (ej: "activar-cuenta?token=XXX")
  // lo separamos para poder comparar limpiamente
  const root = (parts[0] || '').split('?')[0]

  // Vista de Activación de Cuenta (enlace desde correo)
  if (root === 'activar-cuenta') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <ActivarCuentaView />
        </main>
        <Footer />
      </div>
    )
  }

  // Vista de Login
  if (root === 'login') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <LoginView />
        </main>
      </div>
    )
  }

  // Paneles autenticados
  if (root === 'estudiante' && user?.role === 'ESTUDIANTE') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <EstudianteLayout />
        </main>
      </div>
    )
  }
  if (root === 'docente' && user?.role === 'DOCENTE') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <DocenteLayout />
        </main>
      </div>
    )
  }
  if (root === 'admin' && user?.role === 'ADMIN') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <AdminLayout />
        </main>
      </div>
    )
  }

  // Si es usuario autenticado pero está viendo páginas públicas, ok.
  // Si intenta acceder a un panel que no le corresponde, redirigir.
  if (root === 'estudiante' || root === 'docente' || root === 'admin') {
    if (user) {
      // Redirigir a su panel correcto
      const correctPath = user.role === 'ADMIN' ? '/admin' : user.role === 'DOCENTE' ? '/docente' : '/estudiante'
      if (path !== correctPath) {
        setTimeout(() => setPath(correctPath), 100)
      }
    } else {
      // No autenticado, redirigir a login
      setTimeout(() => setPath('/login'), 100)
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Redirigiendo...</p>
      </div>
    )
  }

  // Vista pública
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {root === '' && <InicioView />}
        {root === 'carreras' && <CarrerasView />}
        {root === 'preinscripcion' && <PreinscripcionView />}
        {root === 'contacto' && <ContactoView />}
      </main>
      <Footer />
    </div>
  )
}
