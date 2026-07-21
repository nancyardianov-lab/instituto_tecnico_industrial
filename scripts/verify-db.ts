import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const carreras = await prisma.carrera.count()
  const usuarios = await prisma.user.count()
  const cursos = await prisma.curso.count()
  const libros = await prisma.libro.count()
  const noticias = await prisma.noticia.count()
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })

  console.log('📊 ESTADO DE LA BASE DE DATOS:')
  console.log('  Carreras:', carreras)
  console.log('  Usuarios:', usuarios)
  console.log('  Cursos:', cursos)
  console.log('  Libros:', libros)
  console.log('  Noticias:', noticias)
  console.log('')
  console.log('👤 Admin:')
  console.log('  Email:', admin?.email)
  console.log('  Estado:', admin?.status)
  console.log('  Tiene password:', !!admin?.password)
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1) })
