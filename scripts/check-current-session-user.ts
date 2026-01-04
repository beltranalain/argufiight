/**
 * Script to check which user the current session belongs to
 * This helps debug session/user mismatches
 */

import { prisma } from '../lib/db/prisma'

async function checkCurrentSessionUser() {
  try {
    // Get the most recent active session for belt_champion
    const user = await prisma.user.findUnique({
      where: { username: 'belt_champion' },
      select: {
        id: true,
        username: true,
        email: true,
        isAdmin: true,
      },
    })

    if (!user) {
      console.log('❌ User "belt_champion" not found')
      return
    }

    console.log('\n📊 belt_champion User:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`ID:       ${user.id}`)
    console.log(`Username: ${user.username}`)
    console.log(`Email:    ${user.email}`)
    console.log(`isAdmin:  ${user.isAdmin}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // Get recent sessions for this user
    const sessions = await prisma.session.findMany({
      where: {
        userId: user.id,
        expiresAt: { gt: new Date() }, // Only active sessions
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        token: true,
        createdAt: true,
        expiresAt: true,
      },
    })

    console.log(`📋 Active Sessions for ${user.username}:`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    if (sessions.length === 0) {
      console.log('   No active sessions found')
    } else {
      sessions.forEach((session, index) => {
        console.log(`\n${index + 1}. Session ${session.id.substring(0, 8)}...`)
        console.log(`   Token: ${session.token.substring(0, 20)}...`)
        console.log(`   Created: ${session.createdAt}`)
        console.log(`   Expires: ${session.expiresAt}`)
      })
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    console.log('💡 To access the admin panel:')
    console.log('   1. Log in as "admin" (admin@argufight.com)')
    console.log('   2. OR log in as "studio1" (studio1live00@gmail.com)')
    console.log('   3. OR keep belt_champion as admin (but they won\'t appear on leaderboard)')
    console.log('')
  } catch (error) {
    console.error('Error checking session:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkCurrentSessionUser()
