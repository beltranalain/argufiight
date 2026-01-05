import { prisma } from '../lib/db/prisma'

async function manualAdvanceRound(debateId: string) {
  try {
    console.log(`\n🔍 Checking debate: ${debateId}\n`)

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

    // Check current round statements
    const currentRoundStatements = debate.statements.filter(s => s.round === debate.currentRound)
    const challengerSubmitted = currentRoundStatements.some(s => s.authorId === debate.challengerId)
    const opponentSubmitted = debate.opponentId ? currentRoundStatements.some(s => s.authorId === debate.opponentId) : false

    console.log(`\n📝 Round ${debate.currentRound} Statements:`)
    console.log(`   Challenger submitted: ${challengerSubmitted}`)
    console.log(`   Opponent submitted: ${opponentSubmitted}`)

    if (!challengerSubmitted || !opponentSubmitted) {
      console.log(`\n❌ Both participants haven't submitted yet`)
      return
    }

    if (debate.currentRound >= debate.totalRounds) {
      console.log(`\n✅ Both submitted for final round - marking as COMPLETED`)
      
      await prisma.debate.update({
        where: { id: debateId },
        data: {
          status: 'COMPLETED',
          endedAt: new Date(),
        },
      })

      console.log(`\n✅ Debate marked as COMPLETED`)
    } else {
      console.log(`\n✅ Both submitted - advancing to round ${debate.currentRound + 1}`)
      
      const now = new Date()
      const newDeadline = new Date(now.getTime() + debate.roundDuration)

      await prisma.debate.update({
        where: { id: debateId },
        data: {
          currentRound: debate.currentRound + 1,
          roundDeadline: newDeadline,
        },
      })

      console.log(`\n✅ Debate advanced to round ${debate.currentRound + 1}`)
      console.log(`   New deadline: ${newDeadline}`)
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

const debateId = process.argv[2]

if (!debateId) {
  console.error('Usage: npx tsx scripts/manual-advance-debate-round.ts <debateId>')
  process.exit(1)
}

manualAdvanceRound(debateId)
  .then(() => {
    console.log('\n✅ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
