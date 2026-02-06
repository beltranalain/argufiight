import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { generateAIResponse } from '@/lib/ai/ai-user-responses'
import { calculateWordCount, updateUserAnalyticsOnStatement } from '@/lib/utils/analytics'
import { checkInactiveBelts } from '@/lib/belts/core'
import { verifyCronAuth } from '@/lib/auth/cron-auth'

// Combined AI tasks endpoint - handles both auto-accept and response generation
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const authError = verifyCronAuth(request)
    if (authError) return authError

    const results = {
      autoAccept: { accepted: 0, errors: [] as string[] },
      responses: { generated: 0, errors: [] as string[] },
      beltTasks: { inactiveBeltsChecked: 0, expiredChallengesCleaned: 0, errors: [] as string[] },
    }

    // Single query for all AI users (used by both auto-accept and response generation)
    const aiUsers = await prisma.user.findMany({
      where: {
        isAI: true,
        aiPaused: false,
      },
      select: {
        id: true,
        username: true,
        aiPersonality: true,
        aiResponseDelay: true,
      },
    })

    // ===== AUTO-ACCEPT CHALLENGES =====
    try {
      // Batch query: get all open challenges at once instead of per-AI-user
      const allOpenChallenges = await prisma.debate.findMany({
        where: {
          status: 'WAITING',
          challengeType: 'OPEN',
          opponentId: null,
          // Only accept challenges from human users (prevent AI-to-AI debates)
          challenger: { isAI: false },
        },
        include: {
          challenger: {
            select: { id: true, username: true },
          },
        },
      })

      for (const aiUser of aiUsers) {
        const delayMs = aiUser.aiResponseDelay || 3600000 // Default 1 hour
        const cutoffTime = new Date(Date.now() - delayMs)

        // Filter challenges in-memory instead of separate DB queries per user
        const eligible = allOpenChallenges
          .filter(c => c.challengerId !== aiUser.id && c.createdAt <= cutoffTime)
          .slice(0, 5)

        for (const challenge of eligible) {
          try {
            // Use transaction to batch the 3 writes
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

            results.autoAccept.accepted++
          } catch (error: any) {
            results.autoAccept.errors.push(`Challenge ${challenge.id}: ${error.message}`)
          }
        }
      }
    } catch (error: any) {
      results.autoAccept.errors.push(`Auto-accept error: ${error.message}`)
    }

    // ===== GENERATE AI RESPONSES =====
    try {
      const aiUserIds = aiUsers.map(u => u.id)

      // Batch query: get all active debates for all AI users at once
      const allActiveDebates = await prisma.debate.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { challengerId: { in: aiUserIds } },
            { opponentId: { in: aiUserIds } },
          ],
        },
        include: {
          challenger: {
            select: { id: true, username: true, eloRating: true },
          },
          opponent: {
            select: { id: true, username: true, eloRating: true },
          },
          statements: {
            orderBy: [
              { round: 'asc' },
              { createdAt: 'asc' },
            ],
          },
        },
      })

      for (const aiUser of aiUsers) {
        // Filter debates for this AI user in-memory
        const userDebates = allActiveDebates.filter(
          d => d.challengerId === aiUser.id || d.opponentId === aiUser.id
        )

        for (const debate of userDebates) {
          try {
            if (!debate.opponentId) continue

            // Determine whose turn it is
            const lastStatement = debate.statements[debate.statements.length - 1]
            const isChallengerTurn = !lastStatement || lastStatement.authorId === debate.opponentId
            const isAITurn = (isChallengerTurn && debate.challengerId === aiUser.id) ||
                            (!isChallengerTurn && debate.opponentId === aiUser.id)

            if (!isAITurn) continue

            const now = new Date()
            const delayMs = aiUser.aiResponseDelay || 150000
            const isChallenger = debate.challengerId === aiUser.id

            // Use already-loaded statements instead of separate DB queries
            const challengerStatement = debate.statements.find(
              s => s.authorId === debate.challengerId && s.round === debate.currentRound
            )
            const opponentStatement = debate.statements.find(
              s => s.authorId === debate.opponentId && s.round === debate.currentRound
            )

            // Check delay
            if (isChallenger && opponentStatement) {
              const statementAge = now.getTime() - new Date(opponentStatement.createdAt).getTime()
              if (statementAge < delayMs) continue
            } else if (!isChallenger && challengerStatement) {
              const statementAge = now.getTime() - new Date(challengerStatement.createdAt).getTime()
              if (statementAge < delayMs) continue
            }

            // Generate AI response
            const aiResponse = await generateAIResponse(
              debate.id,
              aiUser.id,
              debate.currentRound
            )

            // Submit the statement
            await prisma.statement.create({
              data: {
                debateId: debate.id,
                authorId: aiUser.id,
                content: aiResponse.trim(),
                round: debate.currentRound,
              },
            })

            // Update analytics
            const wordCount = calculateWordCount(aiResponse)
            await updateUserAnalyticsOnStatement(aiUser.id, wordCount)

            // Send push notification to opponent (non-blocking)
            const humanOpponentId = debate.challengerId === aiUser.id ? debate.opponentId : debate.challengerId
            const { sendYourTurnPushNotification } = await import('@/lib/notifications/push-notifications')
            sendYourTurnPushNotification(humanOpponentId, debate.id, debate.topic).catch((error) => {
              console.error('[AI Tasks] Failed to send push notification:', error)
            })

            // Check if both users have now submitted for this round
            // We know the AI just submitted, so check if the other participant already had
            const otherAlreadySubmitted = isChallenger ? opponentStatement : challengerStatement
            if (otherAlreadySubmitted) {
              if (debate.currentRound >= debate.totalRounds) {
                await prisma.debate.update({
                  where: { id: debate.id },
                  data: {
                    status: 'COMPLETED',
                    endedAt: new Date(),
                  },
                })

                // Trigger verdict generation
                import('@/lib/verdicts/generate-initial').then(async (generateModule) => {
                  try {
                    await generateModule.generateInitialVerdicts(debate.id)
                  } catch (error: any) {
                    console.error('Error generating verdicts:', error)
                  }
                }).catch(() => {})
              } else {
                await prisma.debate.update({
                  where: { id: debate.id },
                  data: {
                    currentRound: debate.currentRound + 1,
                    roundDeadline: new Date(Date.now() + debate.roundDuration),
                  },
                })
              }
            }

            results.responses.generated++
          } catch (error: any) {
            results.responses.errors.push(`Debate ${debate.id}: ${error.message}`)
          }
        }
      }
    } catch (error: any) {
      results.responses.errors.push(`Response generation error: ${error.message}`)
    }

    // ===== BELT SYSTEM TASKS =====
    try {
      const inactiveResult = await checkInactiveBelts()
      results.beltTasks.inactiveBeltsChecked = inactiveResult.beltsMarkedInactive || 0

      const now = new Date()
      const expiredChallenges = await prisma.beltChallenge.updateMany({
        where: {
          status: 'PENDING',
          expiresAt: { lt: now },
        },
        data: {
          status: 'EXPIRED',
        },
      })
      results.beltTasks.expiredChallengesCleaned = expiredChallenges.count
    } catch (error: any) {
      results.beltTasks.errors.push(`Belt tasks error: ${error.message}`)
      console.error('Belt tasks error:', error)
    }

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration,
      results,
    })
  } catch (error: any) {
    console.error('AI tasks cron error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process AI tasks' },
      { status: 500 }
    )
  }
}
