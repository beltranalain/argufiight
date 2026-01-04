import { prisma } from '../lib/db/prisma'

async function checkDebateStatements() {
  const debateId = 'd31d6dd2-cb12-43f2-9136-a78686ccdfb5'
  
  const debate = await prisma.debate.findUnique({
    where: { id: debateId },
    include: {
      challenger: { select: { username: true, isAI: true } },
      opponent: { select: { username: true, isAI: true } },
      statements: {
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { username: true, isAI: true } },
        },
      },
    },
  })

  if (!debate) {
    console.log('❌ Debate not found')
    return
  }

  console.log(`\n📊 Debate: "${debate.topic.substring(0, 60)}${debate.topic.length > 60 ? '...' : ''}"\n`)
  console.log(`   Status: ${debate.status}`)
  console.log(`   Current Round: ${debate.currentRound} / ${debate.totalRounds}`)
  console.log(`   Challenger: ${debate.challenger.username} ${debate.challenger.isAI ? '(AI)' : ''}`)
  console.log(`   Opponent: ${debate.opponent?.username || 'None'} ${debate.opponent?.isAI ? '(AI)' : ''}`)
  console.log(`\n📝 Statements (${debate.statements.length} total):\n`)

  if (debate.statements.length === 0) {
    console.log('   No statements yet')
  } else {
    debate.statements.forEach((stmt, i) => {
      const now = new Date()
      const createdAt = new Date(stmt.createdAt)
      const ageMinutes = Math.floor((now.getTime() - createdAt.getTime()) / 60000)
      
      console.log(`${i + 1}. Round ${stmt.round} - ${stmt.author.username} ${stmt.author.isAI ? '(AI)' : ''}`)
      console.log(`   Created: ${createdAt.toISOString()} (${ageMinutes} minutes ago)`)
      console.log(`   Content: "${stmt.content.substring(0, 80)}${stmt.content.length > 80 ? '...' : ''}"`)
      console.log('')
    })
  }

  // Check current round status
  const currentRoundStatements = debate.statements.filter(s => s.round === debate.currentRound)
  const challengerStatement = currentRoundStatements.find(s => s.authorId === debate.challengerId)
  const opponentStatement = currentRoundStatements.find(s => s.authorId === debate.opponentId)

  console.log(`\n🔄 Round ${debate.currentRound} Status:\n`)
  console.log(`   Challenger (${debate.challenger.username}) statement: ${challengerStatement ? '✅ Submitted' : '❌ Not submitted'}`)
  console.log(`   Opponent (${debate.opponent?.username || 'None'}) statement: ${opponentStatement ? '✅ Submitted' : '❌ Not submitted'}`)
  
  if (opponentStatement) {
    const now = new Date()
    const createdAt = new Date(opponentStatement.createdAt)
    const ageMinutes = Math.floor((now.getTime() - createdAt.getTime()) / 60000)
    console.log(`   Opponent's statement age: ${ageMinutes} minutes`)
  }

  await prisma.$disconnect()
}

checkDebateStatements()
