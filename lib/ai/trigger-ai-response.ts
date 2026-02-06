import { prisma } from '@/lib/db/prisma'
import { generateAIResponse } from '@/lib/ai/ai-user-responses'
import { calculateWordCount, updateUserAnalyticsOnStatement } from '@/lib/utils/analytics'

/**
 * Trigger AI response for a specific debate.
 * Called via after() when a human submits a statement or views a debate.
 * Handles turn detection, response generation, statement submission, and round advancement.
 */
export async function triggerAIResponseForDebate(debateId: string): Promise<boolean> {
  try {
    const debate = await prisma.debate.findUnique({
      where: { id: debateId },
      include: {
        challenger: {
          select: { id: true, username: true, isAI: true, aiPaused: true, aiPersonality: true, aiResponseDelay: true },
        },
        opponent: {
          select: { id: true, username: true, isAI: true, aiPaused: true, aiPersonality: true, aiResponseDelay: true },
        },
        statements: {
          orderBy: [{ round: 'asc' }, { createdAt: 'asc' }],
        },
      },
    })

    if (!debate || debate.status !== 'ACTIVE' || !debate.opponent) {
      return false
    }

    // Find the AI participant (could be challenger or opponent)
    const aiUser =
      (debate.challenger.isAI && !debate.challenger.aiPaused) ? debate.challenger :
      (debate.opponent?.isAI && !debate.opponent.aiPaused) ? debate.opponent :
      null

    if (!aiUser) return false

    // Check if AI already submitted for this round
    const alreadySubmitted = debate.statements.some(
      s => s.authorId === aiUser.id && s.round === debate.currentRound
    )
    if (alreadySubmitted) return false

    // Check if it's AI's turn
    const isChallenger = debate.challengerId === aiUser.id
    const challengerSubmitted = debate.statements.some(
      s => s.authorId === debate.challengerId && s.round === debate.currentRound
    )
    const opponentSubmitted = debate.statements.some(
      s => s.authorId === debate.opponentId && s.round === debate.currentRound
    )

    let shouldRespond = false
    if (isChallenger && !challengerSubmitted) {
      shouldRespond = true // AI is challenger, goes first
    } else if (!isChallenger && challengerSubmitted && !opponentSubmitted) {
      shouldRespond = true // AI is opponent, challenger submitted, AI's turn
    }

    if (!shouldRespond) return false

    // Race condition guard: re-check DB to prevent duplicate submissions
    const recheck = await prisma.statement.findUnique({
      where: {
        debateId_authorId_round: {
          debateId,
          authorId: aiUser.id,
          round: debate.currentRound,
        },
      },
    })
    if (recheck) return false

    // Generate AI response (DeepSeek API call provides natural 3-10s delay)
    const aiResponse = await generateAIResponse(debateId, aiUser.id, debate.currentRound)

    // Submit statement
    await prisma.statement.create({
      data: {
        debateId,
        authorId: aiUser.id,
        content: aiResponse.trim(),
        round: debate.currentRound,
      },
    })

    // Update analytics
    const wordCount = calculateWordCount(aiResponse)
    await updateUserAnalyticsOnStatement(aiUser.id, wordCount)

    // Send push notification to human opponent
    const humanId = isChallenger ? debate.opponentId : debate.challengerId
    if (humanId) {
      try {
        const { sendYourTurnPushNotification } = await import('@/lib/notifications/push-notifications')
        await sendYourTurnPushNotification(humanId, debateId, debate.topic)
      } catch {
        // Push notification failure is non-critical
      }
    }

    // Check if both participants have now submitted for this round
    const otherAlreadySubmitted = isChallenger ? opponentSubmitted : challengerSubmitted
    if (otherAlreadySubmitted) {
      if (debate.currentRound >= debate.totalRounds) {
        // Debate complete
        await prisma.debate.update({
          where: { id: debateId },
          data: { status: 'COMPLETED', endedAt: new Date() },
        })

        // Trigger verdict generation
        try {
          const { generateInitialVerdicts } = await import('@/lib/verdicts/generate-initial')
          await generateInitialVerdicts(debateId)
        } catch (error) {
          console.error('[AI Trigger] Verdict generation failed for debate', debateId)
        }
      } else {
        // Advance to next round
        await prisma.debate.update({
          where: { id: debateId },
          data: {
            currentRound: debate.currentRound + 1,
            roundDeadline: new Date(Date.now() + debate.roundDuration),
          },
        })
      }
    }

    return true
  } catch (error: any) {
    console.error('[AI Trigger] Error for debate', debateId, ':', error.message)
    return false
  }
}
