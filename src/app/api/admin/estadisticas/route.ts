import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { UserRole } from '@prisma/client'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const [
    totalEstudiantes,
    totalDocentes,
    preinscripcionesPendientes,
    solicitudesDocentesPendientes,
    carreras,
    cursos,
    libros,
    noticias,
    preinscripcionesByStatus,
    usuariosByRole,
    correosEnviados,
  ] = await Promise.all([
    db.user.count({ where: { role: UserRole.ESTUDIANTE, status: 'ACTIVO' } }),
    db.user.count({ where: { role: UserRole.DOCENTE, status: 'ACTIVO' } }),
    db.preinscripcion.count({ where: { status: 'PENDIENTE' } }),
    db.user.count({ where: { role: UserRole.DOCENTE, status: 'PENDIENTE' } }),
    db.carrera.count(),
    db.curso.count(),
    db.libro.count(),
    db.noticia.count(),
    db.preinscripcion.groupBy({
      by: ['status'],
      _count: true,
    }),
    db.user.groupBy({
      by: ['role'],
      _count: true,
    }),
    db.correoEnviado.count(),
  ])

  // Estudiantes por carrera
  const estudiantesPorCarrera = await db.user.groupBy({
    by: ['carreraId'],
    where: { role: UserRole.ESTUDIANTE, status: 'ACTIVO' },
    _count: true,
  })
  
  const carrerasInfo = await db.carrera.findMany({ select: { id: true, nombre: true } })
  const carreraMap = Object.fromEntries(carrerasInfo.map(c => [c.id, c.nombre]))
  const estudiantesPorCarreraNamed = estudiantesPorCarrera.map(e => ({
    carrera: e.carreraId ? carreraMap[e.carreraId] : 'Sin carrera',
    cantidad: e._count,
  }))

  return NextResponse.json({
    totalEstudiantes,
    totalDocentes,
    preinscripcionesPendientes,
    solicitudesDocentesPendientes,
    totalCarreras: carreras,
    totalCursos: cursos,
    totalLibros: libros,
    totalNoticias: noticias,
    totalCorreosEnviados: correosEnviados,
    preinscripcionesByStatus,
    usuariosByRole,
    estudiantesPorCarrera: estudiantesPorCarreraNamed,
  })
}
