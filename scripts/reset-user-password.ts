import { prisma } from '../lib/db/prisma'
import { hashPassword } from '../lib/auth/password'

/**
 * Reset a user's password
 * Usage: npx tsx scripts/reset-user-password.ts <email> <new-password>
 * 
 * WARNING: This will overwrite the existing password!
 */

async function resetUserPassword(email: string, newPassword: string) {
  try {
    const normalizedEmail = email.toLowerCase().trim()
    
    console.log(`\n=== Resetting Password ===`)
    console.log(`Email: ${normalizedEmail}`)
    console.log(`\n`)
    
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        username: true,
        passwordHash: true,
        googleAuthEnabled: true,
      },
    })
    
    if (!user) {
      console.log('❌ User not found in database')
      return
    }
    
    if (user.googleAuthEnabled && !user.passwordHash) {
      console.log('⚠️  WARNING: User has Google-only authentication')
      console.log('   Setting password will allow email/password login')
    }
    
    // Hash the new password
    const passwordHash = await hashPassword(newPassword)
    
    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: passwordHash,
      },
    })
    
    console.log('✅ Password reset successfully!')
    console.log(`   User: ${user.username} (${user.email})`)
    console.log(`   You can now login with the new password`)
    
  } catch (error: any) {
    console.error('Error resetting password:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

const email = process.argv[2]
const newPassword = process.argv[3]

if (!email || !newPassword) {
  console.log('Usage: npx tsx scripts/reset-user-password.ts <email> <new-password>')
  console.log('Example: npx tsx scripts/reset-user-password.ts beltranalain@yahoo.com MyNewPassword123!')
  process.exit(1)
}

resetUserPassword(email, newPassword)
