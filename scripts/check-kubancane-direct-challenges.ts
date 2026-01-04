/**
 * Check for DIRECT challenges involving kubancane
 */

import { prisma } from '../lib/db/prisma'

async function checkDirectChallenges() {
  try {
    // Find kubancane user
    const user = await prisma.user.findFirst({
      where: {
        username: {
          contains: 'kuban',
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        username: true,
      },
    })

    if (!user) {
      console.log('❌ User not found')
      return
    }

    console.log(`\n📊 Checking challenges for: ${user.username} (${user.id})\n`)

    // Find all WAITING debates
    const allWaiting = await prisma.debate.findMany({
      where: {
        status: 'WAITING',
      },
      include: {
        challenger: {
          select: {
            username: true,
          },
        },
        opponent: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log(`📋 All WAITING debates (${allWaiting.length}):\n`)
    
    allWaiting.forEach((debate, index) => {
      const isChallenger = debate.challengerId === user.id
      const isOpponent = debate.opponentId === user.id
      const invitedIds = debate.invitedUserIds ? JSON.parse(debate.invitedUserIds) : []
      const isInvited = invitedIds.includes(user.id)
      
      console.log(`${index + 1}. "${debate.topic.substring(0, 50)}..."`)
      console.log(`   ID: ${debate.id}`)
      console.log(`   Type: ${debate.challengeType}`)
      console.log(`   Challenger: ${debate.challenger.username}`)
      console.log(`   Opponent: ${debate.opponent?.username || 'None'}`)
      console.log(`   Invited IDs: ${JSON.stringify(invitedIds)}`)
      console.log(`   Is Challenger: ${isChallenger}`)
      console.log(`   Is Opponent: ${isOpponent}`)
      console.log(`   Is Invited: ${isInvited}`)
      console.log(`   Should show in "My Challenges": ${isChallenger}`)
      console.log(`   Should show in "All Challenges": ${debate.challengeType === 'OPEN' || isInvited || isOpponent}`)
      console.log('')
    })

    // Specifically check debates created by kubancane
    const myChallenges = allWaiting.filter(d => d.challengerId === user.id)
    console.log(`\n✅ Debates created by ${user.username} (should show in "My Challenges"): ${myChallenges.length}\n`)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkDirectChallenges()
