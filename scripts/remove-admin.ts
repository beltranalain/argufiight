import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function removeAdmin(emailOrUsername: string) {
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrUsername },
          { username: emailOrUsername },
        ],
      },
    })

    if (!user) {
      console.error(`❌ User not found: ${emailOrUsername}`)
      return
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isAdmin: false },
    })

    console.log(`✅ User "${user.username}" (${user.email}) is no longer an employee.`)
  } catch (error) {
    console.error('Failed to remove admin status:', error)
  } finally {
    await prisma.$disconnect()
  }
}

const emailOrUsername = process.argv[2]

if (!emailOrUsername) {
  console.log('Usage: tsx scripts/remove-admin.ts <email-or-username>')
  process.exit(1)
}

removeAdmin(emailOrUsername)





