import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  try {
    const email = 'info@kamioi.com'
    const newPassword = 'Kamioi2025!' // Temporary password - user should change after login
    
    // Hash the new password
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(newPassword, saltRounds)
    
    // Update the user's password
    const user = await prisma.user.update({
      where: { email: email },
      data: { passwordHash },
    })
    
    console.log('✅ Password reset successful!')
    console.log('\nLogin credentials:')
    console.log('Email:', email)
    console.log('Password:', newPassword)
    console.log('\n⚠️  IMPORTANT: Please change this password after logging in!')
    console.log('You can change it in your account settings.')
    
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.error('❌ User account not found for:', email)
    } else {
      console.error('Error:', error.message)
    }
  } finally {
    await prisma.$disconnect()
  }
}

main()
