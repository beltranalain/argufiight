import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth/password'

const prisma = new PrismaClient()

async function createAdmin(email: string, username: string, password: string) {
  try {
    // Check if user already exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username },
        ],
      },
    })

    if (existing) {
      // Update existing user to admin and reset password
      const passwordHash = await hashPassword(password)
      await prisma.user.update({
        where: { id: existing.id },
        data: { 
          isAdmin: true,
          passwordHash,
        },
      })
      console.log(`✅ Updated existing user "${existing.username}" (${existing.email}) to admin!`)
      console.log(`   Password has been reset to: ${password}`)
      return
    }

    // Create new admin user
    const passwordHash = await hashPassword(password)
    
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        isAdmin: true,
      },
    })

    console.log(`✅ Created admin user "${user.username}" (${user.email})!`)
    console.log(`   Username: ${username}`)
    console.log(`   Email: ${email}`)
    console.log(`   Password: ${password}`)
  } catch (error) {
    console.error('Failed to create admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Get email, username, and password from command line arguments
const email = process.argv[2] || 'admin@admin.com'
const username = process.argv[3] || 'admin'
const password = process.argv[4] || 'admin123'

createAdmin(email, username, password)

