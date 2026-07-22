'use client'

import { create } from 'zustand'

interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'DOCENTE' | 'ESTUDIANTE'
  status: string
  foto?: string | null
  codigo?: string | null
  telefono?: string | null
  direccion?: string | null
  fechaNacimiento?: string | null
  carreraId?: string | null
  carrera?: { id: string; nombre: string; slug: string } | null
  estudiante?: any
  docente?: any
}

interface AuthState {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
  fetchUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  logout: () => {
    fetch('/api/auth/logout', { method: 'POST' })
    set({ user: null })
  },
  fetchUser: async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      set({ user: data.user, loading: false })
    } catch {
      set({ user: null, loading: false })
    }
  },
}))

// Hash router store
interface RouterState {
  path: string
  setPath: (path: string) => void
  initFromHash: () => void
}

export const useRouterStore = create<RouterState>((set) => ({
  path: typeof window !== 'undefined' ? window.location.hash.slice(1) || '/' : '/',
  setPath: (path) => {
    if (typeof window !== 'undefined') {
      window.location.hash = path
    }
    set({ path })
  },
  initFromHash: () => {
    if (typeof window !== 'undefined') {
      const path = window.location.hash.slice(1) || '/'
      set({ path })
    }
  },
}))
