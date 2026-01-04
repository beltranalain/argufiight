/**
 * Check when AI will respond to the current debate
 */

import { prisma } from '../lib/db/prisma'

async function checkAIResponseTiming() {
  try {
    const debateId = 'd31d6dd2-cb12-43f2-9136-a78686ccdfb5'
    
    // Get the debate
    const debate = await prisma.debate.findUnique({
      where: { id: debateId },
      include: {
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
            aiResponseDelay: true,
            aiPaused: true,
          },
        },
        statements: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
          include: {
            author: {
              select: {
                id: true,
                username: true,
                isAI: true,
              },
            },
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
    console.log(`   Round Duration: ${Math.floor(debate.roundDuration / 3600000)} hours`)
    if (debate.roundDeadline) {
      const deadline = new Date(debate.roundDeadline)
      const now = new Date()
      const timeLeft = deadline.getTime() - now.getTime()
      const hoursLeft = Math.floor(timeLeft / 3600000)
      const minutesLeft = Math.floor((timeLeft % 3600000) / 60000)
      console.log(`   Round Deadline: ${deadline.toISOString()}`)
      console.log(`   Time Left: ${hoursLeft}h ${minutesLeft}m`)
    }
    console.log('')

    // Check recent statements
    console.log(`📝 Recent Statements (${debate.statements.length}):\n`)
    if (debate.statements.length === 0) {
      console.log('   No statements yet')
    } else {
      debate.statements.forEach((stmt, i) => {
        const isAI = stmt.author.isAI
        console.log(`${i + 1}. Round ${stmt.round} - ${stmt.author.username} ${isAI ? '(AI)' : ''}`)
        console.log(`   Created: ${stmt.createdAt}`)
        console.log(`   Content: "${stmt.content.substring(0, 50)}${stmt.content.length > 50 ? '...' : ''}"`)
        console.log('')
      })
    }

    // Determine whose turn it is
    const challengerStatements = debate.statements.filter(s => s.authorId === debate.challengerId && s.round === debate.currentRound)
    const opponentStatements = debate.opponentId ? debate.statements.filter(s => s.authorId === debate.opponentId && s.round === debate.currentRound) : []
    
    console.log(`\n🔄 Current Round ${debate.currentRound} Status:\n`)
    console.log(`   Challenger (${debate.challenger.username}) statements: ${challengerStatements.length}`)
    console.log(`   Opponent (${debate.opponent?.username || 'None'}) statements: ${opponentStatements.length}`)
    
    // Determine whose turn it is (simplified logic)
    const challengerTurn = challengerStatements.length === 0 || (opponentStatements.length > 0 && challengerStatements.length <= opponentStatements.length)
    const opponentTurn = debate.opponentId && (opponentStatements.length === 0 || challengerStatements.length > opponentStatements.length)
    
    console.log(`   Challenger's turn: ${challengerTurn ? '✅ YES' : '❌ NO'}`)
    console.log(`   Opponent's turn: ${opponentTurn ? '✅ YES' : '❌ NO'}`)
    console.log('')

    // Check AI response timing
    const aiUser = debate.challenger.isAI ? debate.challenger : (debate.opponent?.isAI ? debate.opponent : null)
    
    if (aiUser && (aiUser.id === debate.challengerId && challengerTurn) || (aiUser.id === debate.opponentId && opponentTurn)) {
      const delayMs = (aiUser as any).aiResponseDelay || 3600000 // Default 1 hour
      const delayMinutes = Math.floor(delayMs / 60000)
      const delayHours = Math.floor(delayMs / 3600000)
      
      console.log(`\n🤖 AI Response Timing:\n`)
      console.log(`   AI User: ${aiUser.username}`)
      console.log(`   AI Paused: ${(aiUser as any).aiPaused ? '⚠️ YES (AI will not respond)' : '✅ NO'}`)
      console.log(`   Response Delay: ${delayMs}ms (${delayMinutes} minutes / ${delayHours} hours)`)
      
      if ((aiUser as any).aiPaused) {
        console.log(`\n   ⚠️  AI is PAUSED - it will NOT generate responses automatically`)
      } else {
        // Check if there's a statement waiting for AI response
        const lastStatement = debate.statements[0]
        if (lastStatement && !lastStatement.author.isAI) {
          const statementTime = new Date(lastStatement.createdAt)
          const now = new Date()
          const ageMs = now.getTime() - statementTime.getTime()
          const timeUntilResponse = delayMs - ageMs
          
          if (timeUntilResponse > 0) {
            const minutesUntil = Math.floor(timeUntilResponse / 60000)
            const hoursUntil = Math.floor(timeUntilResponse / 3600000)
            console.log(`\n   Last statement from: ${lastStatement.author.username}`)
            console.log(`   Statement age: ${Math.floor(ageMs / 60000)} minutes`)
            console.log(`   AI will respond in: ~${minutesUntil} minutes (~${hoursUntil} hours)`)
          } else {
            console.log(`\n   ✅ AI should respond NOW (delay period has passed)`)
            console.log(`   The AI response cron job should generate a response soon`)
          }
        } else {
          console.log(`\n   ℹ️  Waiting for opponent's statement before AI can respond`)
        }
      }
    } else if (aiUser) {
      console.log(`\n🤖 AI User: ${aiUser.username}`)
      console.log(`   ⏸️  Not AI's turn - waiting for opponent`)
    } else {
      console.log(`\n   ℹ️  No AI user in this debate`)
    }

    console.log('')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkAIResponseTiming()
