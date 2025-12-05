import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function deleteUser(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, username: true, email: true, isAdmin: true },
    })

    if (!user) {
      console.log(`User with email ${email} not found`)
      return
    }

    console.log(`Found user: ${user.username} (${user.email})`)
    console.log(`User ID: ${user.id}`)
    console.log(`Is Admin: ${user.isAdmin}`)

    // Delete the user
    await prisma.user.delete({
      where: { id: user.id },
    })

    console.log(`✅ User ${user.username} (${user.email}) has been deleted successfully`)
  } catch (error: any) {
    console.error('Failed to delete user:', error)
    if (error.code === 'P2025') {
      console.log('User not found in database')
    }
  } finally {
    await prisma.$disconnect()
  }
}

// Get email from command line argument
const email = process.argv[2]

if (!email) {
  console.error('Usage: npx tsx scripts/delete-user.ts <email>')
  console.error('Example: npx tsx scripts/delete-user.ts info@anyfight.com')
  process.exit(1)
}

deleteUser(email)

