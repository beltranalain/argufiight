import { prisma } from '../lib/db/prisma'

async function checkAIResponseStatus() {
  try {
    // Find the user
    const user = await prisma.user.findFirst({
      where: {
        username: {
          contains: 'kuban',
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        username: true,
      },
    })

    if (!user) {
      console.log('❌ User not found')
      return
    }

    console.log(`\n📊 Checking AI response status for: ${user.username}\n`)

    // Find active debates with AI opponent
    const activeDebates = await prisma.debate.findMany({
      where: {
        OR: [
          { challengerId: user.id },
          { opponentId: user.id },
        ],
        status: 'ACTIVE',
      },
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
          },
        },
        statements: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (activeDebates.length === 0) {
      console.log('❌ No active debates found')
      return
    }

    console.log(`Found ${activeDebates.length} active debate(s):\n`)

    for (const debate of activeDebates) {
      console.log(`\n📋 Debate: "${debate.topic.substring(0, 60)}${debate.topic.length > 60 ? '...' : ''}"`)
      console.log(`   ID: ${debate.id}`)
      console.log(`   Status: ${debate.status}`)
      console.log(`   Current Round: ${debate.currentRound}/${debate.totalRounds}`)
      console.log(`   Challenger: ${debate.challenger.username} (AI: ${debate.challenger.isAI})`)
      console.log(`   Opponent: ${debate.opponent?.username || 'None'} (AI: ${debate.opponent?.isAI || false})`)

      // Find AI user
      const aiUser = debate.challenger.isAI ? debate.challenger : (debate.opponent?.isAI ? debate.opponent : null)
      
      if (!aiUser) {
        console.log('   ⚠️ No AI user in this debate')
        continue
      }

      // Get AI user details
      const aiUserDetails = await prisma.user.findUnique({
        where: { id: aiUser.id },
        select: {
          id: true,
          username: true,
          isAI: true,
          aiPaused: true,
          aiResponseDelay: true,
        },
      })

      console.log(`\n   🤖 AI User: ${aiUserDetails?.username}`)
      console.log(`   AI Paused: ${aiUserDetails?.aiPaused ? '⚠️ YES (AI will not respond)' : '✅ NO'}`)
      console.log(`   Response Delay: ${aiUserDetails?.aiResponseDelay || 150000}ms (${Math.floor((aiUserDetails?.aiResponseDelay || 150000) / 60000)} minutes)`)

      // Check statements for current round
      const currentRoundStatements = debate.statements.filter(s => s.round === debate.currentRound)
      const challengerStatement = currentRoundStatements.find(s => s.authorId === debate.challengerId)
      const opponentStatement = debate.opponentId ? currentRoundStatements.find(s => s.authorId === debate.opponentId) : null

      console.log(`\n   📝 Current Round ${debate.currentRound} Statements:`)
      console.log(`   Challenger statement: ${challengerStatement ? '✅ Submitted' : '❌ Not submitted'}`)
      if (challengerStatement) {
        console.log(`      Content: "${challengerStatement.content.substring(0, 50)}..."`)
        console.log(`      Created: ${challengerStatement.createdAt}`)
      }
      console.log(`   Opponent statement: ${opponentStatement ? '✅ Submitted' : '❌ Not submitted'}`)
      if (opponentStatement) {
        console.log(`      Content: "${opponentStatement.content.substring(0, 50)}..."`)
        console.log(`      Created: ${opponentStatement.createdAt}`)
      }

      // Determine whose turn it is
      const isChallengerAI = debate.challenger.isAI
      const isOpponentAI = debate.opponent?.isAI || false

      let isAITurn = false
      let reason = ''

      if (isChallengerAI) {
        // AI is challenger - goes first in each round
        if (!challengerStatement) {
          isAITurn = true
          reason = 'AI challenger needs to go first'
        } else if (opponentStatement && !challengerStatement) {
          isAITurn = true
          reason = 'AI challenger needs to respond to opponent'
        }
      } else if (isOpponentAI) {
        // AI is opponent - responds after challenger
        if (challengerStatement && !opponentStatement) {
          isAITurn = true
          reason = 'AI opponent needs to respond to challenger'
          
          // Check if enough time has passed
          const delayMs = aiUserDetails?.aiResponseDelay || 150000
          const now = new Date()
          const statementAge = now.getTime() - new Date(challengerStatement.createdAt).getTime()
          const minutesPassed = Math.floor(statementAge / 60000)
          const secondsPassed = Math.floor((statementAge % 60000) / 1000)
          
          console.log(`\n   ⏰ Time since challenger's statement: ${minutesPassed}m ${secondsPassed}s`)
          console.log(`   Required delay: ${Math.floor(delayMs / 60000)} minutes`)
          
          if (statementAge < delayMs) {
            const timeRemaining = delayMs - statementAge
            const minutesRemaining = Math.ceil(timeRemaining / 60000)
            console.log(`   ⏳ AI will respond in ~${minutesRemaining} more minute(s)`)
            reason += ` (waiting ${minutesRemaining} more minute(s))`
          } else {
            console.log(`   ✅ Delay period passed - AI should respond now`)
          }
        }
      }

      console.log(`\n   🎯 Is AI's turn: ${isAITurn ? '✅ YES' : '❌ NO'}`)
      if (isAITurn) {
        console.log(`   Reason: ${reason}`)
      }

      // Check if AI already submitted for this round
      const aiStatement = currentRoundStatements.find(s => s.authorId === aiUser.id)
      if (aiStatement) {
        console.log(`\n   ✅ AI already submitted for round ${debate.currentRound}`)
        console.log(`      Content: "${aiStatement.content.substring(0, 50)}..."`)
        console.log(`      Created: ${aiStatement.createdAt}`)
      }
    }

    console.log('\n\n💡 Next Steps:')
    console.log('   - If AI is paused, unpause it in admin panel')
    console.log('   - If delay period hasn\'t passed, wait for it to pass')
    console.log('   - The cron job runs every 5 minutes or when debates are viewed')
    console.log('   - You can manually trigger: GET /api/cron/ai-generate-responses\n')

  } catch (error: any) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAIResponseStatus()
