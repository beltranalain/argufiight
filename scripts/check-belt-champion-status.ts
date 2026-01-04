/**
 * Script to check belt_champion user status
 */

import { prisma } from '../lib/db/prisma'

async function checkBeltChampion() {
  try {
    const user = await prisma.user.findUnique({
      where: { username: 'belt_champion' },
      select: {
        id: true,
        email: true,
        username: true,
        eloRating: true,
        isAdmin: true,
        isBanned: true,
        totalDebates: true,
        debatesWon: true,
        debatesLost: true,
        debatesTied: true,
      },
    })

    if (!user) {
      console.log('❌ User "belt_champion" not found')
      return
    }

    console.log('\n📊 belt_champion User Information:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`ID:           ${user.id}`)
    console.log(`Email:        ${user.email}`)
    console.log(`Username:     ${user.username}`)
    console.log(`ELO Rating:   ${user.eloRating}`)
    console.log(`isAdmin:      ${user.isAdmin}`)
    console.log(`isBanned:     ${user.isBanned}`)
    console.log(`Total Debates: ${user.totalDebates}`)
    console.log(`Record:       ${user.debatesWon}W ${user.debatesLost}L ${user.debatesTied}T`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    if (user.isAdmin) {
      console.log('⚠️  WARNING: This user is marked as ADMIN (excluded from leaderboard)')
    }
    if (user.isBanned) {
      console.log('⚠️  WARNING: This user is marked as BANNED (excluded from leaderboard)')
    }
    if (!user.isAdmin && !user.isBanned) {
      console.log('✅ User should appear on leaderboard')
    }
  } catch (error) {
    console.error('Error checking user:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkBeltChampion()
