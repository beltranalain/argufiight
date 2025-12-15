import { prisma } from '../lib/db/prisma'
import { verifyPassword, hashPassword } from '../lib/auth/password'

async function testLogin(email: string, password: string) {
  try {
    console.log(`\n=== Testing Login for: ${email} ===\n`)

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        username: true,
        passwordHash: true,
        isBanned: true,
      },
    })

    if (!user) {
      console.log('❌ User not found!')
      return
    }

    console.log(`✅ User found: ${user.username}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Banned: ${user.isBanned ? 'Yes' : 'No'}`)
    console.log(`   Password hash exists: ${user.passwordHash ? 'Yes' : 'No'}`)
    console.log(`   Hash length: ${user.passwordHash?.length || 0} characters`)

    // Test password verification
    if (user.passwordHash) {
      console.log('\n--- Testing Password Verification ---')
      const isValid = await verifyPassword(password, user.passwordHash)
      console.log(`Password valid: ${isValid ? '✅ YES' : '❌ NO'}`)

      if (!isValid) {
        console.log('\n⚠️  Password does not match!')
        console.log('You can reset the password by running:')
        console.log(`   npm run reset-password ${email} <new-password>`)
      }
    } else {
      console.log('\n⚠️  No password hash found! User needs to set a password.')
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Get email and password from command line
const email = process.argv[2]
const password = process.argv[3]

if (!email || !password) {
  console.log('Usage: npx tsx scripts/test-login.ts <email> <password>')
  console.log('\nExample:')
  console.log('  npx tsx scripts/test-login.ts admin@admin.com password123')
  process.exit(1)
}

testLogin(email, password)






