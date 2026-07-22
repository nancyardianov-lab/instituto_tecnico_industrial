/**
 * MIGRACIÓN: Convierte cursos "carrera + año" en materias individuales.
 *
 * PROBLEMA:
 *   El seed anterior creaba un "Curso" por cada combinación carrera+año
 *   (ej: "Computación - 5° año", "Dibujo de Construcción - 4° año").
 *   Pero un curso real es una materia individual: "Física", "Teoría de la
 *   Información", "Organización de Empresas", etc.
 *
 * QUÉ HACE:
 *   1. Lee todos los Curso existentes con su `pensum` (JSON de materias).
 *   2. Para cada materia listada en el pensum, crea un Curso nuevo con:
 *        - nombre = nombre de la materia (ej: "Física")
 *        - carreraId = la carrera del curso original
 *        - anio = el año del curso original
 *        - descripcion = "Materia de {anio}° año de {carrera}"
 *        - pensum = "[]" (ya no aplica, cada Curso ES una materia)
 *   3. Elimina los Curso antiguos (carrera+año). Por cascada se borran:
 *        - CursoAsignado (asignaciones de docentes)
 *        - Horario + HorarioEstudiante
 *        - Inscripcion
 *        - Tarea + Entrega
 *        - Calificacion
 *   4. El administrador deberá re-asignar docentes a las materias
 *      individuales desde el panel "Asignar Docentes".
 *
 * USO:
 *   npx tsx scripts/migraciones/migrar-cursos-a-materias.ts
 *   (o: npx ts-node scripts/migraciones/migrar-cursos-a-materias.ts)
 *
 * ES SEGURO: solo se ejecuta una vez. Si se vuelve a correr, detecta que
 * no hay cursos con formato "carrera + año" y no hace nada.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Heurística: un Curso es "carrera+año" (legacy) si su nombre contiene
// " - X° año" o si su `pensum` es un arreglo JSON con varias entradas.
// Un Curso que ya es materia individual tiene `pensum = "[]"`.
function esCursoLegacy(curso: { nombre: string; pensum: string }): boolean {
  if (/\s*-\s*\d+°?\s*año/i.test(curso.nombre)) return true
  try {
    const p = JSON.parse(curso.pensum || '[]')
    return Array.isArray(p) && p.length > 0
  } catch {
    return false
  }
}

async function main() {
  console.log('=== Migración: cursos carrera+año → materias individuales ===\n')

  const cursos = await prisma.curso.findMany({
    include: { carrera: { select: { nombre: true } } },
  })
  console.log(`Total de cursos en la BD: ${cursos.length}`)

  const legacy = cursos.filter(esCursoLegacy)
  const yaMigrados = cursos.filter(c => !esCursoLegacy(c))

  console.log(`Cursos legacy (carrera+año): ${legacy.length}`)
  console.log(`Cursos ya migrados (materias individuales): ${yaMigrados.length}\n`)

  if (legacy.length === 0) {
    console.log('✓ No hay cursos legacy para migrar. Todo OK.')
    return
  }

  let nuevasMaterias = 0
  for (const c of legacy) {
    let materias: any[] = []
    try {
      materias = JSON.parse(c.pensum || '[]')
    } catch {
      materias = []
    }

    if (!Array.isArray(materias) || materias.length === 0) {
      console.log(`  ⚠ Curso "${c.nombre}" no tiene pensum, se omitirá la creación de materias`)
    } else {
      for (const m of materias) {
        const nombreMateria = (m.area || m.subarea || m.nombre || '').trim()
        if (!nombreMateria) continue
        // Evitar duplicados: si ya existe una materia con el mismo nombre
        // en la misma carrera y año, no la creamos de nuevo.
        const existente = await prisma.curso.findFirst({
          where: {
            nombre: nombreMateria,
            carreraId: c.carreraId,
            anio: c.anio,
          },
        })
        if (existente) {
          console.log(`  ↻ "${nombreMateria}" ya existe en ${c.carrera?.nombre} ${c.anio}°, se omite`)
          continue
        }
        await prisma.curso.create({
          data: {
            nombre: nombreMateria,
            carreraId: c.carreraId,
            anio: c.anio,
            descripcion: `Materia de ${c.anio}° año de ${c.carrera?.nombre || ''}`,
            pensum: '[]',
            activo: true,
          },
        })
        nuevasMaterias++
      }
    }
  }
  console.log(`\n✓ ${nuevasMaterias} materias individuales creadas`)

  // Eliminar los cursos legacy (por cascada se borran asignaciones,
  // horarios, inscripciones, tareas, calificaciones)
  console.log('\nEliminando cursos legacy (carrera+año)...')
  let borrados = 0
  for (const c of legacy) {
    try {
      await prisma.curso.delete({ where: { id: c.id } })
      borrados++
    } catch (e: any) {
      console.log(`  ⚠ No se pudo eliminar "${c.nombre}": ${e?.message || e}`)
    }
  }
  console.log(`✓ ${borrados} cursos legacy eliminados`)

  // Resumen final
  const total = await prisma.curso.count()
  console.log(`\n=== Migración completa ===`)
  console.log(`Total de cursos (materias individuales) en la BD: ${total}`)
  console.log(`\nPRÓXIMOS PASOS:`)
  console.log(`  1. Entre al panel de admin → Gestión Académica → Cursos`)
  console.log(`     y verifique que ahora aparecen materias individuales`)
  console.log(`     (Física, Teoría de la Información, etc.).`)
  console.log(`  2. Vaya a "Asignar Docentes" y asigne cada materia a un docente.`)
  console.log(`  3. Vaya a "Horarios" y defina los horarios de cada materia.`)
}

main()
  .catch((e) => {
    console.error('Error en la migración:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
