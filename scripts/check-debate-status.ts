import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDebateStatus() {
  try {
    // Check for recent debates with AI user as opponent
    const recentDebates = await prisma.debate.findMany({
      where: {
        OR: [
          {
            opponent: {
              isAI: true,
            },
          },
          {
            challenger: {
              username: 'kamioi',
            },
          },
        ],
      },
      include: {
        challenger: {
          select: {
            username: true,
            isAI: true,
          },
        },
        opponent: {
          select: {
            username: true,
            isAI: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    })

    console.log('\n=== Recent Debates ===')
    if (recentDebates.length === 0) {
      console.log('No recent debates found.')
    } else {
      recentDebates.forEach((debate) => {
        console.log(`\n"${debate.topic}"`)
        console.log(`  - Status: ${debate.status}`)
        console.log(`  - Challenger: ${debate.challenger.username}${debate.challenger.isAI ? ' (AI)' : ''}`)
        console.log(`  - Opponent: ${debate.opponent?.username || 'None'}${debate.opponent?.isAI ? ' (AI)' : ''}`)
        console.log(`  - Created: ${new Date(debate.createdAt).toLocaleString()}`)
        if (debate.startedAt) {
          console.log(`  - Started: ${new Date(debate.startedAt).toLocaleString()}`)
        }
      })
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDebateStatus()

