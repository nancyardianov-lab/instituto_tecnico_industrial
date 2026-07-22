// Sistema de autenticación basado en JWT en cookies httpOnly
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'iti-secret-key-change-in-production-2024')
const COOKIE_NAME = 'iti_session'

export interface SessionPayload {
  userId: string
  email: string
  name: string
  role: 'ADMIN' | 'DOCENTE' | 'ESTUDIANTE'
  status: string
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET)
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return await verifyToken(token)
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    // Sesión corta: la cookie expira en 8 horas. Combinada con la
    // limpieza agresiva al cargar la página principal (ver page.tsx)
    // y el logout automático al cerrar el navegador, garantiza que la
    // página NO abra ya logueada del admin.
    maxAge: 60 * 60 * 8, // 8 horas
    path: '/',
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  // Borra la cookie en múltiples formatos para garantizar que se elimine
  // sin importar cómo fue setada originalmente.
  cookieStore.delete(COOKIE_NAME)
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
    maxAge: 0,
  })
}

export const SESSION_COOKIE_NAME = COOKIE_NAME
