/**
 * Script to fix user admin status
 * Usage: npx tsx scripts/fix-user-admin-status.ts <email> [true|false]
 */

import { prisma } from '../lib/db/prisma'

async function fixUserAdminStatus(email: string, shouldBeAdmin: boolean = false) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        isAdmin: true,
      },
    })

    if (!user) {
      console.log(`❌ User with email ${email} not found`)
      return
    }

    console.log('\n📊 Current User Information:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`Email:    ${user.email}`)
    console.log(`Username: ${user.username}`)
    console.log(`isAdmin:  ${user.isAdmin}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    if (user.isAdmin === shouldBeAdmin) {
      console.log(`✅ User already has isAdmin=${shouldBeAdmin} (no change needed)`)
      return
    }

    // Update admin status
    await prisma.user.update({
      where: { email },
      data: { isAdmin: shouldBeAdmin },
    })

    console.log(`✅ Updated user admin status: isAdmin=${shouldBeAdmin}`)
    console.log('\n⚠️  User will need to refresh the page to see changes')
  } catch (error) {
    console.error('Error updating user:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

const email = process.argv[2]
const shouldBeAdmin = process.argv[3] === 'true'

if (!email) {
  console.error('Usage: npx tsx scripts/fix-user-admin-status.ts <email> [true|false]')
  console.error('Example: npx tsx scripts/fix-user-admin-status.ts basktballapp@gmail.com false')
  process.exit(1)
}

fixUserAdminStatus(email, shouldBeAdmin)
