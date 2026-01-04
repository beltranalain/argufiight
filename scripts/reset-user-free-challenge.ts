/**
 * Reset free belt challenge for a user (KubanCane)
 */

import { prisma } from '../lib/db/prisma'

async function resetUserFreeChallenge() {
  try {
    const username = process.argv[2] || 'KubanCane'
    console.log(`\n🔄 Resetting free belt challenge for user: ${username}...\n`)

    // Find user by username (try exact first, then case-insensitive)
    let user = await prisma.user.findUnique({
      where: { username },
      select: { 
        id: true, 
        username: true, 
        coins: true,
        freeBeltChallengesAvailable: true,
        lastFreeChallengeReset: true,
      },
    })

    // Try case-insensitive search if not found
    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          username: { equals: username, mode: 'insensitive' }
        },
        select: { 
          id: true, 
          username: true, 
          coins: true,
          freeBeltChallengesAvailable: true,
          lastFreeChallengeReset: true,
        },
      })
    }

    if (!user) {
      console.error(`❌ User "${username}" not found`)
      console.error(`   Tried: exact match and case-insensitive search`)
      process.exit(1)
    }

    console.log(`✅ Found user: ${user.username} (ID: ${user.id})`)
    console.log(`   Current coins: ${user.coins.toLocaleString()}`)
    console.log(`   Current free challenges: ${user.freeBeltChallengesAvailable}`)
    console.log(`   Last reset: ${user.lastFreeChallengeReset || 'Never'}`)

    // Reset free challenge
    const now = new Date()
    await prisma.user.update({
      where: { id: user.id },
      data: {
        freeBeltChallengesAvailable: 1,
        lastFreeChallengeReset: now,
      },
    })

    console.log(`\n✅ Successfully reset free challenge`)
    console.log(`   Free challenges available: 1`)
    console.log(`   Reset time: ${now.toISOString()}\n`)

    process.exit(0)
  } catch (error: any) {
    console.error('\n❌ Error resetting free challenge:', error.message)
    console.error(error)
    process.exit(1)
  }
}

resetUserFreeChallenge()
