/**
 * Script to remove admin status from belt_champion so they appear on leaderboard
 */

import { prisma } from '../lib/db/prisma'

async function fixBeltChampionAdmin() {
  try {
    const user = await prisma.user.findUnique({
      where: { username: 'belt_champion' },
      select: {
        id: true,
        username: true,
        email: true,
        isAdmin: true,
        eloRating: true,
      },
    })

    if (!user) {
      console.error('❌ User "belt_champion" not found')
      process.exit(1)
    }

    console.log('\n📊 Current Status:')
    console.log(`Username: ${user.username}`)
    console.log(`Email: ${user.email}`)
    console.log(`ELO: ${user.eloRating}`)
    console.log(`isAdmin: ${user.isAdmin}\n`)

    if (!user.isAdmin) {
      console.log('✅ User is already not an admin (no change needed)')
      return
    }

    // Remove admin status
    await prisma.user.update({
      where: { id: user.id },
      data: { isAdmin: false },
    })

    console.log('✅ Removed admin status from belt_champion')
    console.log('✅ User should now appear on the leaderboard\n')
  } catch (error) {
    console.error('Error fixing user:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

fixBeltChampionAdmin()
