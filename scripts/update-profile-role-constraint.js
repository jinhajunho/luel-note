const { PrismaClient } = require('../lib/generated/prisma')

const prisma = new PrismaClient()

async function main() {
  console.log('Updating profiles.role check constraint to allow guest role...')

  await prisma.$executeRawUnsafe('ALTER TABLE "profiles" DROP CONSTRAINT IF EXISTS "profiles_role_check";')
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "profiles" ADD CONSTRAINT "profiles_role_check"
      CHECK (role IN ('guest', 'member', 'instructor', 'admin') OR role IS NULL);
  `)

  console.log('Done!')
}

main()
  .catch((error) => {
    console.error('Failed to update profiles.role constraint:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
