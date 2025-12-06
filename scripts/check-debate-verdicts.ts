import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDebateVerdicts() {
  try {
    // Find the completed debate
    const debate = await prisma.debate.findFirst({
      where: {
        status: {
          in: ['COMPLETED', 'VERDICT_READY'],
        },
        opponent: {
          isAI: true,
        },
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
            isAI: true,
          },
        },
        verdicts: {
          include: {
            judge: {
              select: {
                name: true,
                personality: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        endedAt: 'desc',
      },
    })

    if (!debate) {
      console.log('No completed debate found with AI user.')
      return
    }

    console.log(`\n=== Debate: "${debate.topic}" ===`)
    console.log(`Status: ${debate.status}`)
    console.log(`Challenger: ${debate.challenger.username}`)
    console.log(`Opponent: ${debate.opponent?.username}${debate.opponent?.isAI ? ' (AI)' : ''}`)
    if (debate.endedAt) {
      console.log(`Completed: ${new Date(debate.endedAt).toLocaleString()}`)
      const timeSinceCompletion = Date.now() - new Date(debate.endedAt).getTime()
      const minutesSince = Math.floor(timeSinceCompletion / 60000)
      console.log(`Time since completion: ${minutesSince} minute(s)`)
    }

    console.log(`\n=== Verdicts (${debate.verdicts.length}) ===`)
    if (debate.verdicts.length === 0) {
      console.log('❌ No verdicts generated yet')
      console.log('\nVerdicts should be generated automatically when a debate is completed.')
    } else {
      debate.verdicts.forEach((verdict, idx) => {
        console.log(`\n${idx + 1}. ${verdict.judge.name} (${verdict.judge.personality})`)
        console.log(`   Winner: ${verdict.winner === debate.challengerId ? debate.challenger.username : debate.opponent?.username}`)
        console.log(`   Created: ${new Date(verdict.createdAt).toLocaleString()}`)
        if (verdict.reasoning) {
          console.log(`   Reasoning: ${verdict.reasoning.substring(0, 100)}...`)
        }
      })
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDebateVerdicts()

