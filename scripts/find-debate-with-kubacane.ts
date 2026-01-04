/**
 * Find debate created with Kubacane user
 */

import { prisma } from '../lib/db/prisma'

async function findDebate() {
  try {
    // Find user kubancane (case-insensitive)
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
        email: true,
      },
    })

    if (!user) {
      console.log('❌ User with "kuban" in username not found')
      return
    }

    console.log(`\n📊 Found user: ${user.username} (${user.email})`)
    console.log(`   ID: ${user.id}\n`)

    // Find recent debates where this user is involved
    const debates = await prisma.debate.findMany({
      where: {
        OR: [
          { challengerId: user.id },
          { opponentId: user.id },
        ],
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
      take: 10,
    })

    console.log(`📋 Found ${debates.length} debates involving ${user.username}:\n`)
    
    if (debates.length === 0) {
      console.log('   No debates found')
    } else {
      debates.forEach((debate, index) => {
        console.log(`${index + 1}. "${debate.topic.substring(0, 60)}${debate.topic.length > 60 ? '...' : ''}"`)
        console.log(`   ID: ${debate.id}`)
        console.log(`   Status: ${debate.status}`)
        console.log(`   Type: ${debate.challengeType}`)
        console.log(`   Challenger: ${debate.challenger.username}`)
        console.log(`   Opponent: ${debate.opponent?.username || 'None'}`)
        console.log(`   Created: ${debate.createdAt}`)
        console.log('')
      })
    }

    // Also check for debates created by current user (kubancane) that are WAITING
    const myChallenges = await prisma.debate.findMany({
      where: {
        challengerId: user.id,
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

    console.log(`\n📋 "My Challenges" (WAITING debates created by ${user.username}): ${myChallenges.length}\n`)
    
    if (myChallenges.length === 0) {
      console.log('   No WAITING challenges found')
    } else {
      myChallenges.forEach((debate, index) => {
        console.log(`${index + 1}. "${debate.topic.substring(0, 60)}${debate.topic.length > 60 ? '...' : ''}"`)
        console.log(`   ID: ${debate.id}`)
        console.log(`   Type: ${debate.challengeType}`)
        console.log(`   Opponent: ${debate.opponent?.username || 'None (OPEN challenge)'}`)
        console.log(`   Created: ${debate.createdAt}`)
        console.log('')
      })
    }
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

findDebate()
