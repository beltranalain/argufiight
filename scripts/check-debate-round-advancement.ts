import { prisma } from '../lib/db/prisma'

async function checkRoundAdvancement(debateId: string) {
  try {
    console.log(`\n🔍 Checking debate round advancement: ${debateId}\n`)

    const debate = await prisma.debate.findUnique({
      where: { id: debateId },
      include: {
        statements: true,
      },
    })

    if (!debate) {
      console.log('❌ Debate not found')
      return
    }

    console.log('✅ Debate found!')
    console.log(`   Topic: ${debate.topic}`)
    console.log(`   Status: ${debate.status}`)
    console.log(`   Current Round: ${debate.currentRound}/${debate.totalRounds}`)
    console.log(`   Round Duration: ${debate.roundDuration}ms (${Math.floor(debate.roundDuration / 3600000)} hours)`)
    console.log(`   Round Deadline: ${debate.roundDeadline || 'Not set'}`)

    console.log(`\n📝 Statements by Round:`)
    const statementsByRound: Record<number, any[]> = {}
    debate.statements.forEach(stmt => {
      if (!statementsByRound[stmt.round]) {
        statementsByRound[stmt.round] = []
      }
      statementsByRound[stmt.round].push(stmt)
    })

    Object.keys(statementsByRound).sort().forEach(round => {
      const roundNum = parseInt(round)
      const statements = statementsByRound[roundNum]
      console.log(`\n   Round ${roundNum}:`)
      statements.forEach(stmt => {
        console.log(`     - ${stmt.authorId.substring(0, 8)}... (${new Date(stmt.createdAt).toLocaleTimeString()})`)
      })
      console.log(`     Total: ${statements.length} statement(s)`)
    })

    // Check current round
    const currentRoundStatements = debate.statements.filter(s => s.round === debate.currentRound)
    const challengerSubmitted = currentRoundStatements.some(s => s.authorId === debate.challengerId)
    const opponentSubmitted = debate.opponentId ? currentRoundStatements.some(s => s.authorId === debate.opponentId) : false

    console.log(`\n🎯 Round ${debate.currentRound} Status:`)
    console.log(`   Challenger submitted: ${challengerSubmitted}`)
    console.log(`   Opponent submitted: ${opponentSubmitted}`)
    console.log(`   Both submitted: ${challengerSubmitted && opponentSubmitted}`)

    if (challengerSubmitted && opponentSubmitted) {
      if (debate.currentRound >= debate.totalRounds) {
        console.log(`\n✅ Both submitted for final round - debate should be completed`)
        console.log(`   Current status: ${debate.status}`)
        if (debate.status === 'ACTIVE') {
          console.log(`   ⚠️  Debate should be COMPLETED or VERDICT_READY but is still ACTIVE`)
        }
      } else {
        console.log(`\n✅ Both submitted for round ${debate.currentRound} - should advance to round ${debate.currentRound + 1}`)
        console.log(`   Current round: ${debate.currentRound}`)
        console.log(`   ⚠️  Debate should have advanced to round ${debate.currentRound + 1}`)
      }
    } else {
      console.log(`\n⏳ Waiting for both participants to submit`)
    }

    return debate
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

const debateId = process.argv[2]

if (!debateId) {
  console.error('Usage: npx tsx scripts/check-debate-round-advancement.ts <debateId>')
  process.exit(1)
}

checkRoundAdvancement(debateId)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
