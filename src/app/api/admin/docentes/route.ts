import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { UserRole, UserStatus } from '@prisma/client'

// GET - listar docentes activos con sus asignaciones
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const docentes = await db.docente.findMany({
    include: {
      user: {
        select: { id: true, name: true, email: true, codigo: true, status: true },
      },
      _count: { select: { cursos: true } },
    },
    where: { user: { status: UserStatus.ACTIVO } },
    orderBy: { user: { name: 'asc' } },
  })

  return NextResponse.json({ docentes })
}
