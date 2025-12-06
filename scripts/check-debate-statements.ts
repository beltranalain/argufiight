import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDebateStatements() {
  try {
    // Find the active debate with AI user
    const debate = await prisma.debate.findFirst({
      where: {
        status: 'ACTIVE',
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
        statements: {
          include: {
            author: {
              select: {
                username: true,
                isAI: true,
              },
            },
          },
          orderBy: [
            { round: 'asc' },
            { createdAt: 'asc' },
          ],
        },
      },
    })

    if (!debate) {
      console.log('No active debate found with AI user.')
      return
    }

    console.log(`\n=== Debate: "${debate.topic}" ===`)
    console.log(`Status: ${debate.status}`)
    console.log(`Current Round: ${debate.currentRound} of ${debate.totalRounds}`)
    console.log(`Challenger: ${debate.challenger.username}`)
    console.log(`Opponent: ${debate.opponent?.username}${debate.opponent?.isAI ? ' (AI)' : ''}`)
    console.log(`\nStatements (${debate.statements.length}):`)
    
    if (debate.statements.length === 0) {
      console.log('  No statements yet.')
    } else {
      debate.statements.forEach((stmt, idx) => {
        console.log(`\n  ${idx + 1}. Round ${stmt.round} - ${stmt.author.username}${stmt.author.isAI ? ' (AI)' : ''}`)
        console.log(`     Created: ${new Date(stmt.createdAt).toLocaleString()}`)
        console.log(`     Content: ${stmt.content.substring(0, 100)}...`)
      })
    }

    // Check whose turn it is
    const challengerStmt = debate.statements.find(s => 
      s.author.id === debate.challengerId && s.round === debate.currentRound
    )
    const opponentStmt = debate.opponentId ? debate.statements.find(s => 
      s.author.id === debate.opponentId && s.round === debate.currentRound
    ) : null

    console.log(`\n=== Turn Status ===`)
    if (!challengerStmt) {
      console.log('Challenger needs to submit for Round', debate.currentRound)
    } else {
      console.log('✅ Challenger submitted for Round', debate.currentRound)
    }
    
    if (debate.opponentId) {
      if (!opponentStmt) {
        console.log(`${debate.opponent?.isAI ? '🤖 AI' : 'Opponent'} needs to submit for Round`, debate.currentRound)
      } else {
        console.log(`✅ ${debate.opponent?.isAI ? 'AI' : 'Opponent'} submitted for Round`, debate.currentRound)
      }
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDebateStatements()

