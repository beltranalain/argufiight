import { prisma } from '../lib/db/prisma'
import { generateAIResponse } from '../lib/ai/ai-user-responses'
import { calculateWordCount, updateUserAnalyticsOnStatement } from '../lib/utils/analytics'

async function forceAIResponse() {
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

    console.log(`\n📊 Forcing AI response for: ${user.username}\n`)

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

    const debate = activeDebates[0]
    console.log(`📋 Debate: "${debate.topic.substring(0, 60)}${debate.topic.length > 60 ? '...' : ''}"`)
    console.log(`   ID: ${debate.id}`)
    console.log(`   Current Round: ${debate.currentRound}/${debate.totalRounds}\n`)

    // Find AI user
    const aiUser = debate.challenger.isAI ? debate.challenger : (debate.opponent?.isAI ? debate.opponent : null)
    
    if (!aiUser) {
      console.log('❌ No AI user in this debate')
      return
    }

    // Get AI user details
    const aiUserDetails = await prisma.user.findUnique({
      where: { id: aiUser.id },
      select: {
        id: true,
        username: true,
        isAI: true,
        aiPaused: true,
      },
    })

    if (!aiUserDetails || aiUserDetails.aiPaused) {
      console.log('❌ AI user is paused or not found')
      return
    }

    // Check statements for current round
    const currentRoundStatements = debate.statements.filter(s => s.round === debate.currentRound)
    const challengerStatement = currentRoundStatements.find(s => s.authorId === debate.challengerId)
    const opponentStatement = debate.opponentId ? currentRoundStatements.find(s => s.authorId === debate.opponentId) : null

    const isChallenger = debate.challengerId === aiUser.id
    const isOpponent = debate.opponentId === aiUser.id

    // Check if it's AI's turn
    let shouldRespond = false
    
    if (isChallenger) {
      if (!challengerStatement) {
        shouldRespond = true
      }
    } else if (isOpponent) {
      if (challengerStatement && !opponentStatement) {
        shouldRespond = true
      }
    }

    if (!shouldRespond) {
      console.log('❌ It\'s not the AI\'s turn')
      if (challengerStatement) console.log('   Challenger has submitted')
      if (opponentStatement) console.log('   Opponent has submitted')
      return
    }

    console.log(`🤖 Generating response for ${aiUserDetails.username}...\n`)

    // Generate AI response (bypassing delay check)
    const response = await generateAIResponse(debate.id, aiUser.id, debate.currentRound)

    // Create statement
    const statement = await prisma.statement.create({
      data: {
        debateId: debate.id,
        authorId: aiUser.id,
        round: debate.currentRound,
        content: response.trim(),
      },
    })

    console.log(`✅ AI response generated and submitted!`)
    console.log(`   Statement ID: ${statement.id}`)
    console.log(`   Content: "${response.substring(0, 100)}..."\n`)

    // Update user analytics
    const wordCount = calculateWordCount(response)
    await updateUserAnalyticsOnStatement(aiUser.id, wordCount)

    // Check if both participants have submitted for this round
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

    // If both have submitted, advance to next round or complete
    if (updatedChallengerStatement && updatedOpponentStatement) {
      if (debate.currentRound >= debate.totalRounds) {
        // Debate complete, mark as COMPLETED
        await prisma.debate.update({
          where: { id: debate.id },
          data: {
            status: 'COMPLETED',
            endedAt: new Date(),
          },
        })

        console.log(`🎉 Debate completed! Status changed to COMPLETED`)
        console.log(`   Triggering verdict generation...`)

        // Trigger verdict generation
        const { generateInitialVerdicts } = await import('../lib/verdicts/generate-initial')
        try {
          await generateInitialVerdicts(debate.id)
          console.log(`✅ Verdict generation completed`)
        } catch (error: any) {
          console.error(`❌ Failed to generate verdicts:`, error.message)
        }
      } else {
        // Advance to next round
        await prisma.debate.update({
          where: { id: debate.id },
          data: {
            currentRound: debate.currentRound + 1,
            roundDeadline: new Date(Date.now() + debate.roundDuration),
          },
        })

        console.log(`📈 Debate advanced to round ${debate.currentRound + 1}`)
      }
    }

  } catch (error: any) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

forceAIResponse()
