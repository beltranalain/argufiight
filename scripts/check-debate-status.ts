import { prisma } from '../lib/db/prisma'

async function checkDebateStatus(debateId: string) {
  try {
    console.log(`\n🔍 Checking debate: ${debateId}\n`)

    const debate = await prisma.debate.findUnique({
      where: { id: debateId },
      select: {
        id: true,
        topic: true,
        status: true,
        currentRound: true,
        totalRounds: true,
        challenger: {
          select: {
            id: true,
            username: true,
            isAI: true,
          },
        },
        opponent: {
          select: {
            id: true,
            username: true,
            isAI: true,
          },
        },
        statements: {
          select: {
            id: true,
            round: true,
            content: true,
            authorId: true,
            createdAt: true,
          },
        },
        createdAt: true,
        updatedAt: true,
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
    console.log(`   Challenger: ${debate.challenger.username} (AI: ${debate.challenger.isAI})`)
    console.log(`   Opponent: ${debate.opponent?.username || 'None'} (AI: ${debate.opponent?.isAI || false})`)
    console.log(`   Created: ${debate.createdAt}`)
    console.log(`   Updated: ${debate.updatedAt}`)
    
    console.log(`\n📝 Statements (${debate.statements.length} total):`)
    debate.statements.forEach((stmt, i) => {
      const author = stmt.authorId === debate.challenger.id ? debate.challenger.username : debate.opponent?.username || 'Unknown'
      console.log(`   ${i + 1}. Round ${stmt.round} by ${author}: ${stmt.content.substring(0, 60)}...`)
      console.log(`      Created: ${stmt.createdAt}`)
    })

    // Check who should respond next
    const currentRoundStatements = debate.statements.filter(s => s.round === debate.currentRound)
    const challengerSubmitted = currentRoundStatements.some(s => s.authorId === debate.challenger.id)
    const opponentSubmitted = currentRoundStatements.some(s => s.authorId === debate.opponent?.id)

    console.log(`\n🎯 Current Round Analysis:`)
    console.log(`   Challenger submitted: ${challengerSubmitted}`)
    console.log(`   Opponent submitted: ${opponentSubmitted}`)
    
    if (debate.status === 'ACTIVE') {
      if (!challengerSubmitted && !debate.challenger.isAI) {
        console.log(`\n⏳ Waiting for challenger (${debate.challenger.username}) to submit`)
      } else if (!opponentSubmitted && debate.opponent && !debate.opponent.isAI) {
        console.log(`\n⏳ Waiting for opponent (${debate.opponent.username}) to submit`)
      } else if (!challengerSubmitted && debate.challenger.isAI) {
        console.log(`\n🤖 AI challenger should generate response`)
      } else if (!opponentSubmitted && debate.opponent?.isAI) {
        console.log(`\n🤖 AI opponent should generate response`)
      }
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
  console.error('Usage: npx tsx scripts/check-debate-status.ts <debateId>')
  process.exit(1)
}

checkDebateStatus(debateId)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
