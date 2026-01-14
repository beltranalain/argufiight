import { prisma } from '../lib/db/prisma'

async function checkAISettings(debateId: string) {
  try {
    console.log(`\n🔍 Checking AI user settings for debate: ${debateId}\n`)

    const debate = await prisma.debate.findUnique({
      where: { id: debateId },
      select: {
        id: true,
        topic: true,
        challengerId: true,
        opponentId: true,
        currentRound: true,
      },
    })

    if (!debate) {
      console.log('❌ Debate not found')
      return
    }

    console.log('✅ Debate found!')
    console.log(`   Topic: ${debate.topic}`)
    console.log(`   Current Round: ${debate.currentRound}`)
    console.log(`   Challenger ID: ${debate.challengerId}`)
    console.log(`   Opponent ID: ${debate.opponentId}`)

    // Check opponent (AI user)
    if (debate.opponentId) {
      const opponent = await prisma.user.findUnique({
        where: { id: debate.opponentId },
        select: {
          id: true,
          username: true,
          isAI: true,
          aiPaused: true,
          aiResponseDelay: true,
        },
      })

      if (opponent) {
        console.log(`\n🤖 Opponent (${opponent.username}):`)
        console.log(`   isAI: ${opponent.isAI}`)
        console.log(`   aiPaused: ${opponent.aiPaused}`)
        console.log(`   aiResponseDelay: ${opponent.aiResponseDelay || 'Not set (default: 150000ms = 2.5 min)'}`)
        
        if (!opponent.isAI) {
          console.log(`   ⚠️  Opponent is not an AI user!`)
        } else if (opponent.aiPaused) {
          console.log(`   ⚠️  AI is paused! This prevents responses.`)
        }
      }
    }

    // Check challenger (might also be AI)
    const challenger = await prisma.user.findUnique({
      where: { id: debate.challengerId },
      select: {
        id: true,
        username: true,
        isAI: true,
        aiPaused: true,
        aiResponseDelay: true,
      },
    })

    if (challenger) {
      console.log(`\n👤 Challenger (${challenger.username}):`)
      console.log(`   isAI: ${challenger.isAI}`)
      if (challenger.isAI) {
        console.log(`   aiPaused: ${challenger.aiPaused}`)
        console.log(`   aiResponseDelay: ${challenger.aiResponseDelay || 'Not set (default: 150000ms = 2.5 min)'}`)
      }
    }

    // Check current round statements
    const roundStatements = await prisma.statement.findMany({
      where: {
        debateId: debateId,
        round: debate.currentRound,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    console.log(`\n📝 Round ${debate.currentRound} Statements:`)
    roundStatements.forEach((stmt, idx) => {
      const author = stmt.authorId === debate.challengerId ? challenger : (debate.opponentId ? opponent : null)
      const authorName = author?.username || stmt.authorId.substring(0, 8)
      const timeAgo = Math.floor((Date.now() - new Date(stmt.createdAt).getTime()) / 60000)
      console.log(`   ${idx + 1}. ${authorName}: ${stmt.content.substring(0, 50)}... (${timeAgo} min ago)`)
    })

    // Check if AI should respond
    const challengerStmt = roundStatements.find(s => s.authorId === debate.challengerId)
    const opponentStmt = debate.opponentId ? roundStatements.find(s => s.authorId === debate.opponentId) : null

    if (debate.opponentId && opponent) {
      const isAI = opponent.isAI && !opponent.aiPaused
      const shouldRespond = challengerStmt && !opponentStmt
      
      console.log(`\n🎯 AI Response Check:`)
      console.log(`   Challenger submitted: ${!!challengerStmt}`)
      console.log(`   Opponent submitted: ${!!opponentStmt}`)
      console.log(`   AI should respond: ${shouldRespond && isAI}`)
      
      if (shouldRespond && isAI && challengerStmt) {
        const delayMs = opponent.aiResponseDelay || 150000
        const statementAge = Date.now() - new Date(challengerStmt.createdAt).getTime()
        const minutesAgo = Math.floor(statementAge / 60000)
        const minutesNeeded = Math.ceil(delayMs / 60000)
        
        console.log(`   Statement age: ${minutesAgo} minutes`)
        console.log(`   Delay required: ${minutesNeeded} minutes`)
        console.log(`   Can respond now: ${statementAge >= delayMs}`)
        
        if (statementAge < delayMs) {
          const minutesRemaining = Math.ceil((delayMs - statementAge) / 60000)
          console.log(`   ⏳ Waiting ${minutesRemaining} more minute(s)`)
        } else {
          console.log(`   ✅ Delay has passed - AI should respond!`)
        }
      } else if (!isAI) {
        console.log(`   ⚠️  Opponent is not an active AI user`)
      } else if (!shouldRespond) {
        console.log(`   ⚠️  Not AI's turn (challenger hasn't submitted or opponent already submitted)`)
      }
    }

    return { debate, challenger, opponent }
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

const debateId = process.argv[2]

if (!debateId) {
  console.error('Usage: npx tsx scripts/check-ai-user-settings.ts <debateId>')
  process.exit(1)
}

checkAISettings(debateId)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
