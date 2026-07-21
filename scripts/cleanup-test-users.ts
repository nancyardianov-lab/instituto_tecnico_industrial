import { db } from '../src/lib/db'

async function main() {
  // Borrar usuario de prueba del flujo de activación
  const emails = [
    'profesor.flujo.test@gmail.com',
    'prof.test.1784648368@example.com',
  ]
  for (const email of emails) {
    const u = await db.user.findUnique({ where: { email } })
    if (u) {
      await db.auditLog.deleteMany({ where: { OR: [{ userId: u.id }, { metadata: { contains: u.id } }] } }).catch(() => {})
      await db.correoEnviado.deleteMany({ where: { destinatario: email } }).catch(() => {})
      await db.user.delete({ where: { id: u.id } })
      console.log(`Eliminado: ${email}`)
    } else {
      console.log(`No encontrado: ${email}`)
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(e => { console.error(e); process.exit(1) })
