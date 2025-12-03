import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function makeAdmin(emailOrUsername: string, remove: boolean = false) {
  try {
    // Find user by email or username
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
      console.log('\nAvailable users:')
      const allUsers = await prisma.user.findMany({
        select: { email: true, username: true, isAdmin: true },
      })
      allUsers.forEach(u => {
        console.log(`  - ${u.username} (${u.email}) - Employee: ${u.isAdmin}`)
      })
      return
    }

    // Update user admin status
    await prisma.user.update({
      where: { id: user.id },
      data: { isAdmin: !remove },
    })

    if (remove) {
      console.log(`✅ User "${user.username}" (${user.email}) is no longer an employee.`)
    } else {
      console.log(`✅ User "${user.username}" (${user.email}) is now an employee!`)
    }
  } catch (error) {
    console.error('Failed to update user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Get email/username from command line argument
const emailOrUsername = process.argv[2]
const remove = process.argv.includes('--remove')

if (!emailOrUsername) {
  console.log('Usage: tsx scripts/make-admin.ts <email-or-username> [--remove]')
  console.log('\nExample:')
  console.log('  tsx scripts/make-admin.ts user@example.com')
  console.log('  tsx scripts/make-admin.ts myusername')
  console.log('  tsx scripts/make-admin.ts myusername --remove')
  process.exit(1)
}

makeAdmin(emailOrUsername, remove)

