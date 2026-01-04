/**
 * Script to check and fix user admin status
 * Usage: npx tsx scripts/check-user-admin-status.ts <email>
 */

import { prisma } from '../lib/db/prisma'

async function checkUserAdminStatus(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        isAdmin: true,
        createdAt: true,
      },
    })

    if (!user) {
      console.log(`❌ User with email ${email} not found`)
      return
    }

    console.log('\n📊 User Information:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`ID:       ${user.id}`)
    console.log(`Email:    ${user.email}`)
    console.log(`Username: ${user.username}`)
    console.log(`isAdmin:  ${user.isAdmin}`)
    console.log(`Created:  ${user.createdAt}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    if (user.isAdmin) {
      console.log('⚠️  WARNING: This user has admin privileges!')
      console.log('\nTo remove admin status, run:')
      console.log(`npx tsx scripts/fix-user-admin-status.ts ${email}`)
    } else {
      console.log('✅ User does not have admin privileges (correct)')
    }
  } catch (error) {
    console.error('Error checking user:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

const email = process.argv[2]
if (!email) {
  console.error('Usage: npx tsx scripts/check-user-admin-status.ts <email>')
  process.exit(1)
}

checkUserAdminStatus(email)
