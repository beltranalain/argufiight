import { prisma } from '../lib/db/prisma'

async function checkRecentDebates() {
  try {
    // Find the user
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

    console.log(`\n📊 Checking recent debates for: ${user.username} (${user.id})\n`)

    // Get recent debates (same query as ProfilePanel)
    const debates = await prisma.debate.findMany({
      where: {
        OR: [
          { challengerId: user.id },
          { opponentId: user.id },
        ],
        status: {
          not: 'WAITING',
        },
      },
      include: {
        challenger: {
          select: {
            id: true,
            username: true,
          },
        },
        opponent: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    })

    console.log(`Found ${debates.length} recent debate(s):\n`)

    debates.forEach((debate, i) => {
      console.log(`${i + 1}. "${debate.topic.substring(0, 60)}${debate.topic.length > 60 ? '...' : ''}"`)
      console.log(`   ID: ${debate.id}`)
      console.log(`   Status: ${debate.status}`)
      console.log(`   Winner ID: ${debate.winnerId || 'null'}`)
      console.log(`   Has winnerId: ${!!debate.winnerId}`)
      console.log(`   Challenger: ${debate.challenger.username} (${debate.challenger.id})`)
      console.log(`   Opponent: ${debate.opponent?.username || 'None'} (${debate.opponent?.id || 'None'})`)
      
      const isWinner = debate.winnerId === user.id
      const isTie = !debate.winnerId
      console.log(`   User is winner: ${isWinner}`)
      console.log(`   Is tie: ${isTie}`)
      
      // Check what the UI would show
      let badgeText = ''
      if (debate.winnerId !== null && debate.winnerId !== undefined) {
        badgeText = isWinner ? 'Won' : 'Lost'
      } else if (debate.status === 'VERDICT_READY') {
        badgeText = 'Verdict Ready'
      } else if (debate.status === 'ACTIVE') {
        badgeText = 'Ongoing'
      } else if (debate.status === 'COMPLETED') {
        badgeText = 'Awaiting Verdict'
      } else {
        badgeText = debate.status
      }
      
      console.log(`   UI Badge: ${badgeText}`)
      console.log('')
    })

  } catch (error: any) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkRecentDebates()
