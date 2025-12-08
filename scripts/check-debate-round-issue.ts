import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDebate() {
  const debateId = 'f7ad360a-78ce-4eff-a1e3-824eec6d633d'
  
  try {
    const debate = await prisma.debate.findUnique({
      where: { id: debateId },
      include: {
        challenger: {
          select: {
            id: true,
            username: true,
          }
        },
        opponent: {
          select: {
            id: true,
            username: true,
          }
        },
        statements: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
              }
            }
          },
          orderBy: {
            round: 'asc',
          }
        }
      }
    })

    if (!debate) {
      console.log('❌ Debate not found')
      return
    }

    console.log('\n=== DEBATE STATUS ===')
    console.log('ID:', debate.id)
    console.log('Topic:', debate.topic)
    console.log('Status:', debate.status)
    console.log('Current Round:', debate.currentRound)
    console.log('Total Rounds:', debate.totalRounds)
    console.log('Round Deadline:', debate.roundDeadline)
    console.log('Challenger:', debate.challenger.username, `(${debate.challenger.id})`)
    console.log('Opponent:', debate.opponent?.username || 'None', debate.opponent ? `(${debate.opponent.id})` : '')

    console.log('\n=== STATEMENTS BY ROUND ===')
    const statementsByRound: Record<number, typeof debate.statements> = {}
    debate.statements.forEach(s => {
      if (!statementsByRound[s.round]) {
        statementsByRound[s.round] = []
      }
      statementsByRound[s.round].push(s)
    })

    for (let round = 1; round <= debate.totalRounds; round++) {
      const roundStatements = statementsByRound[round] || []
      console.log(`\nRound ${round}:`)
      if (roundStatements.length === 0) {
        console.log('  No statements')
      } else {
        roundStatements.forEach(s => {
          console.log(`  - ${s.author.username}: ${s.content.substring(0, 50)}...`)
        })
      }
    }

    console.log('\n=== CURRENT ROUND ANALYSIS ===')
    const currentRoundStatements = debate.statements.filter(s => s.round === debate.currentRound)
    console.log(`Round ${debate.currentRound} statements:`, currentRoundStatements.length)
    
    const challengerSubmitted = currentRoundStatements.some(s => s.author.id === debate.challenger.id)
    const opponentSubmitted = debate.opponent ? currentRoundStatements.some(s => s.author.id === debate.opponent!.id) : false
    
    console.log('Challenger submitted:', challengerSubmitted)
    console.log('Opponent submitted:', opponentSubmitted)
    console.log('Both submitted:', challengerSubmitted && opponentSubmitted)

    console.log('\n=== ISSUE DIAGNOSIS ===')
    if (debate.status !== 'ACTIVE') {
      console.log('❌ Debate is not ACTIVE. Status:', debate.status)
    }
    
    if (debate.currentRound > debate.totalRounds) {
      console.log('❌ Current round exceeds total rounds!')
    }
    
    if (debate.currentRound < debate.totalRounds && challengerSubmitted && opponentSubmitted) {
      console.log('⚠️  Both submitted but round not advanced. This should have advanced automatically.')
    }

    if (debate.currentRound === debate.totalRounds && challengerSubmitted && opponentSubmitted) {
      console.log('✅ Final round completed. Debate should be COMPLETED.')
    }

    if (debate.roundDeadline && new Date(debate.roundDeadline) < new Date()) {
      console.log('⚠️  Round deadline has expired:', debate.roundDeadline)
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDebate()

