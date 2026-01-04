/**
 * Script to check all users with admin status
 * Usage: npx tsx scripts/check-all-admin-users.ts
 */

import { prisma } from '../lib/db/prisma'

async function checkAllAdminUsers() {
  try {
    // Get all users with admin status
    const adminUsers = await prisma.user.findMany({
      where: { isAdmin: true },
      select: {
        id: true,
        email: true,
        username: true,
        isAdmin: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    // Get total user count
    const totalUsers = await prisma.user.count()

    console.log('\n📊 Admin Users Report:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`Total Users:     ${totalUsers}`)
    console.log(`Admin Users:     ${adminUsers.length}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    if (adminUsers.length === 0) {
      console.log('✅ No users have admin privileges')
    } else {
      console.log('⚠️  Users with admin privileges:')
      adminUsers.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.username} (${user.email})`)
        console.log(`   ID: ${user.id}`)
        console.log(`   Created: ${user.createdAt}`)
      })
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  } catch (error) {
    console.error('Error checking admin users:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkAllAdminUsers()
