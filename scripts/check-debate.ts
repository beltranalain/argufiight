import { prisma } from '../lib/db/prisma.js'

async function checkDebate() {
  try {
    const debateId = '151cc66a-8c0c-4e68-a8f8-97894e0fc63c'
    
    const debate = await prisma.debate.findUnique({
      where: { id: debateId },
      include: {
        challenger: {
          select: { username: true },
        },
        opponent: {
          select: { username: true },
        },
        statements: {
          select: {
            id: true,
            round: true,
            authorId: true,
            content: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })
    
    if (!debate) {
      console.log('Debate not found')
      return
    }
    
    console.log('Debate Details:')
    console.log(`  ID: ${debate.id}`)
    console.log(`  Status: ${debate.status}`)
    console.log(`  Current Round: ${debate.currentRound}/${debate.totalRounds}`)
    console.log(`  Round Deadline: ${debate.roundDeadline}`)
    console.log(`  Created: ${debate.createdAt}`)
    console.log(`  Challenger: @${debate.challenger.username}`)
    console.log(`  Opponent: @${debate.opponent.username}`)
    console.log(`\nStatements (${debate.statements.length}):`)
    
    debate.statements.forEach((stmt, i) => {
      const author = stmt.authorId === debate.challengerId ? debate.challenger.username : debate.opponent.username
      console.log(`  ${i + 1}. Round ${stmt.round} by @${author}: ${stmt.content.substring(0, 50)}...`)
    })
    
    // Check round 1 statements
    const round1Statements = debate.statements.filter(s => s.round === 1)
    console.log(`\nRound 1 Statements: ${round1Statements.length}`)
    round1Statements.forEach(stmt => {
      const author = stmt.authorId === debate.challengerId ? debate.challenger.username : debate.opponent.username
      console.log(`  - @${author}`)
    })
    
    const now = new Date()
    const deadlinePassed = debate.roundDeadline && debate.roundDeadline < now
    console.log(`\nRound Deadline Status:`)
    console.log(`  Deadline: ${debate.roundDeadline}`)
    console.log(`  Now: ${now}`)
    console.log(`  Deadline Passed: ${deadlinePassed}`)
    
  } catch (error: any) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkDebate()
