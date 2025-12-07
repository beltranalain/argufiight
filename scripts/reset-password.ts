import { prisma } from '../lib/db/prisma'
import { hashPassword } from '../lib/auth/password'

async function resetPassword(email: string, newPassword: string) {
  try {
    console.log(`\n=== Resetting Password for: ${email} ===\n`)

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!user) {
      console.log('❌ User not found!')
      return
    }

    console.log(`✅ User found: ${user.username}`)

    // Validate password
    if (newPassword.length < 6) {
      console.log('❌ Password must be at least 6 characters')
      return
    }

    // Hash new password
    console.log('Hashing new password...')
    const newPasswordHash = await hashPassword(newPassword)

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    })

    console.log('✅ Password reset successfully!')
    console.log(`\nYou can now login with:`)
    console.log(`   Email: ${email}`)
    console.log(`   Password: ${newPassword}`)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Get email and password from command line
const email = process.argv[2]
const newPassword = process.argv[3]

if (!email || !newPassword) {
  console.log('Usage: npx tsx scripts/reset-password.ts <email> <new-password>')
  console.log('\nExample:')
  console.log('  npx tsx scripts/reset-password.ts admin@admin.com newpassword123')
  process.exit(1)
}

resetPassword(email, newPassword)


