import { prisma } from '../lib/db/prisma'
import { generateAIResponse } from '../lib/ai/ai-user-responses'
import { calculateWordCount, updateUserAnalyticsOnStatement } from '../lib/utils/analytics'

async function manualTriggerAIResponse(debateId: string) {
  try {
    console.log(`\n🔍 Checking debate: ${debateId}\n`)

    const debate = await prisma.debate.findUnique({
      where: { id: debateId },
      include: {
        challenger: {
          select: {
            id: true,
            username: true,
            isAI: true,
            aiPaused: true,
            aiResponseDelay: true,
          },
        },
        opponent: {
          select: {
            id: true,
            username: true,
            isAI: true,
            aiPaused: true,
            aiResponseDelay: true,
          },
        },
        statements: {
          where: {
            round: {
              // Get current round statements
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
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
    console.log(`   Challenger: ${debate.challenger.username} (AI: ${debate.challenger.isAI}, Paused: ${debate.challenger.aiPaused})`)
    console.log(`   Opponent: ${debate.opponent?.username || 'None'} (AI: ${debate.opponent?.isAI || false}, Paused: ${debate.opponent?.aiPaused || false})`)

    // Find AI user
    const aiUser = debate.challenger.isAI ? debate.challenger : debate.opponent
    if (!aiUser || !aiUser.isAI) {
      console.log('❌ No AI user in this debate')
      return
    }

    if (aiUser.aiPaused) {
      console.log('❌ AI user is paused')
      return
    }

    // Get statements for current round
    const currentRoundStatements = debate.statements.filter(s => s.round === debate.currentRound)
    const challengerStatement = currentRoundStatements.find(s => s.authorId === debate.challengerId)
    const opponentStatement = debate.opponentId ? currentRoundStatements.find(s => s.authorId === debate.opponentId) : null

    console.log(`\n📝 Current Round ${debate.currentRound} Statements:`)
    console.log(`   Challenger submitted: ${!!challengerStatement}`)
    console.log(`   Opponent submitted: ${!!opponentStatement}`)

    const isChallenger = debate.challengerId === aiUser.id
    const isOpponent = debate.opponentId === aiUser.id

    // Check if it's AI's turn
    let shouldRespond = false
    
    if (isChallenger) {
      // Challenger goes first in each round
      if (!challengerStatement) {
        shouldRespond = true
        console.log(`\n✅ AI challenger should go first`)
      } else {
        console.log(`\n❌ AI challenger already submitted`)
      }
    } else if (isOpponent) {
      // Opponent responds after challenger
      if (challengerStatement && !opponentStatement) {
        shouldRespond = true
        console.log(`\n✅ AI opponent should respond to challenger`)
      } else if (!challengerStatement) {
        console.log(`\n⏳ Waiting for challenger to submit first`)
      } else {
        console.log(`\n❌ AI opponent already submitted`)
      }
    }

    if (!shouldRespond) {
      console.log(`\n❌ It's not the AI's turn to respond`)
      return
    }

    // Check delay
    const delayMs = aiUser.aiResponseDelay || 150000 // Default 2.5 minutes
    const now = new Date()
    
    if (isOpponent && challengerStatement) {
      const statementAge = now.getTime() - new Date(challengerStatement.createdAt).getTime()
      console.log(`\n⏱️  Statement age: ${Math.floor(statementAge / 60000)} minutes`)
      console.log(`   Required delay: ${delayMs / 60000} minutes`)
      
      if (statementAge < delayMs) {
        console.log(`\n⚠️  Delay not met yet. Waiting ${Math.ceil((delayMs - statementAge) / 60000)} more minute(s)`)
        console.log(`\n💡 Forcing response anyway (bypassing delay)...`)
      }
    }

    console.log(`\n🤖 Generating AI response for ${aiUser.username}...\n`)

    // Generate AI response (bypassing delay check)
    const response = await generateAIResponse(debate.id, aiUser.id, debate.currentRound)

    console.log(`✅ Response generated (${response.length} characters)`)
    console.log(`   Preview: ${response.substring(0, 100)}...`)

    // Create statement
    const statement = await prisma.statement.create({
      data: {
        debateId: debate.id,
        authorId: aiUser.id,
        round: debate.currentRound,
        content: response.trim(),
      },
    })

    console.log(`\n✅ Statement created!`)
    console.log(`   Statement ID: ${statement.id}`)
    console.log(`   Round: ${statement.round}`)

    // Update user analytics
    const wordCount = calculateWordCount(response)
    await updateUserAnalyticsOnStatement(aiUser.id, wordCount)

    console.log(`\n✅ Analytics updated (${wordCount} words)`)

    // Check if both have submitted for this round
    const updatedChallengerStatement = await prisma.statement.findUnique({
      where: {
        debateId_authorId_round: {
          debateId: debate.id,
          authorId: debate.challengerId,
          round: debate.currentRound,
        },
      },
    })

    const updatedOpponentStatement = debate.opponentId ? await prisma.statement.findUnique({
      where: {
        debateId_authorId_round: {
          debateId: debate.id,
          authorId: debate.opponentId,
          round: debate.currentRound,
        },
      },
    }) : null

    if (updatedChallengerStatement && updatedOpponentStatement) {
      console.log(`\n🎉 Both participants have submitted for round ${debate.currentRound}`)
      console.log(`   The debate will advance to the next round or complete`)
    }

    return statement
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

const debateId = process.argv[2]

if (!debateId) {
  console.error('Usage: npx tsx scripts/manual-trigger-ai-response.ts <debateId>')
  process.exit(1)
}

manualTriggerAIResponse(debateId)
  .then(() => {
    console.log('\n✅ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
