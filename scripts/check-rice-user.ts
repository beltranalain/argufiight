/**
 * Check RiceSzn user details
 */

import { prisma } from '../lib/db/prisma'
import { verifyPassword } from '../lib/auth/password'

async function checkRiceUser() {
  try {
    // Try exact email
    let user = await prisma.user.findUnique({
      where: { email: 'RiceSzn@RiceSzn.com' },
      select: {
        id: true,
        email: true,
        username: true,
        passwordHash: true,
        googleAuthEnabled: true,
        isAdmin: true,
      },
    })

    // If not found, try lowercase
    if (!user) {
      user = await prisma.user.findUnique({
        where: { email: 'riceszn@riceszn.com' },
        select: {
          id: true,
          email: true,
          username: true,
          passwordHash: true,
          googleAuthEnabled: true,
          isAdmin: true,
        },
      })
    }

    // If still not found, try by username
    if (!user) {
      user = await prisma.user.findFirst({
        where: { username: 'RiceSzn' },
        select: {
          id: true,
          email: true,
          username: true,
          passwordHash: true,
          googleAuthEnabled: true,
          isAdmin: true,
        },
      })
    }

    if (!user) {
      console.log('❌ User not found')
      return
    }

    console.log('\n✅ User found:')
    console.log(`   ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Username: ${user.username}`)
    console.log(`   Has Password: ${user.passwordHash ? 'Yes' : 'No'}`)
    console.log(`   Google Auth Enabled: ${user.googleAuthEnabled ? 'Yes' : 'No'}`)
    console.log(`   Is Admin: ${user.isAdmin}`)

    // Test password
    if (user.passwordHash) {
      console.log('\n🔐 Testing password: Test123!')
      try {
        const isValid = await verifyPassword('Test123!', user.passwordHash)
        console.log(`   Password valid: ${isValid ? '✅ Yes' : '❌ No'}`)
      } catch (error) {
        console.error('   Password verification error:', error)
      }
    }

    // Check what email format login route would use
    const normalizedEmail = 'RiceSzn@RiceSzn.com'.toLowerCase().trim()
    console.log(`\n📧 Login route would normalize to: "${normalizedEmail}"`)
    console.log(`   Database has: "${user.email}"`)
    console.log(`   Match: ${normalizedEmail === user.email.toLowerCase() ? '✅ Yes' : '❌ No'}`)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkRiceUser()
