import { prisma } from '@/lib/db/prisma'

/**
 * Check for and auto-accept open challenges for AI users.
 * Called via after() when debates are listed, or by the daily cron.
 * Only accepts challenges from human users that have been waiting longer than the AI's delay.
 */
export async function triggerAIAutoAccept(): Promise<number> {
  try {
    const aiUsers = await prisma.user.findMany({
      where: { isAI: true, aiPaused: false },
      select: { id: true, username: true, aiResponseDelay: true },
    })

    if (aiUsers.length === 0) return 0

    const allOpenChallenges = await prisma.debate.findMany({
      where: {
        status: 'WAITING',
        challengeType: 'OPEN',
        opponentId: null,
        // Only accept challenges from human users (prevent AI-to-AI debates)
        challenger: { isAI: false },
      },
      include: {
        challenger: { select: { id: true, username: true } },
      },
    })

    if (allOpenChallenges.length === 0) return 0

    let accepted = 0

    for (const aiUser of aiUsers) {
      // Accept delay: use a short window so bots pick up challenges quickly
      // Cap at 5 min — aiResponseDelay may be tuned for response timing, not acceptance
      const delayMs = Math.min(aiUser.aiResponseDelay || 150000, 300000)
      const cutoffTime = new Date(Date.now() - delayMs)

      const eligible = allOpenChallenges
        .filter(c => c.challengerId !== aiUser.id && c.createdAt <= cutoffTime)
        .slice(0, 5) // Max 5 per AI user per run

      for (const challenge of eligible) {
        try {
          await prisma.$transaction([
            prisma.debate.update({
              where: { id: challenge.id },
              data: {
                opponentId: aiUser.id,
                status: 'ACTIVE',
                startedAt: new Date(),
                roundDeadline: new Date(Date.now() + challenge.roundDuration),
              },
            }),
            prisma.userSubscription.upsert({
              where: { userId: aiUser.id },
              update: {},
              create: {
                userId: aiUser.id,
                tier: 'FREE',
                status: 'ACTIVE',
                billingCycle: null,
              },
            }),
            prisma.notification.create({
              data: {
                userId: challenge.challenger.id,
                type: 'DEBATE_ACCEPTED',
                title: 'Challenge Accepted',
                message: `${aiUser.username} has accepted your challenge: ${challenge.topic}`,
                debateId: challenge.id,
              },
            }),
          ])
          accepted++

          // Trigger AI's opening argument (respects the response delay)
          try {
            const { triggerAIResponseForDebate } = await import('./trigger-ai-response')
            await triggerAIResponseForDebate(challenge.id)
          } catch {
            // Response will be triggered when someone views the debate
          }
        } catch {
          // Likely race condition — another process already accepted this challenge
        }
      }
    }

    return accepted
  } catch (error: any) {
    console.error('[AI Auto-Accept] Error:', error.message)
    return 0
  }
}
