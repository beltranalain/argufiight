import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { generateAIResponse } from '@/lib/ai/ai-user-responses'
import { calculateWordCount, updateUserAnalyticsOnStatement } from '@/lib/utils/analytics'
import { checkInactiveBelts } from '@/lib/belts/core'

// Combined AI tasks endpoint - handles both auto-accept and response generation
// This can be called more frequently via external cron services
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  console.log('[AI Tasks] ========== Starting AI tasks cron job ==========')

  try {
    // Verify this is a cron request
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results = {
      autoAccept: { accepted: 0, errors: [] as string[] },
      responses: { generated: 0, errors: [] as string[] },
      beltTasks: { inactiveBeltsChecked: 0, expiredChallengesCleaned: 0, errors: [] as string[] },
    }

    // ===== AUTO-ACCEPT CHALLENGES =====
    try {
      const aiUsers = await prisma.user.findMany({
        where: {
          isAI: true,
          aiPaused: false,
        },
        select: {
          id: true,
          username: true,
          aiResponseDelay: true,
        },
      })

      console.log(`[AI Tasks] Found ${aiUsers.length} active AI users for auto-accept`)

      for (const aiUser of aiUsers) {
        const delayMs = aiUser.aiResponseDelay || 3600000 // Default 1 hour
        const cutoffTime = new Date(Date.now() - delayMs)

        const openChallenges = await prisma.debate.findMany({
          where: {
            status: 'WAITING',
            challengeType: 'OPEN',
            createdAt: { lte: cutoffTime },
            challengerId: { not: aiUser.id },
            opponentId: null,
          },
          include: {
            challenger: {
              select: { id: true, username: true },
            },
          },
          take: 5, // Limit to 5 per AI user per run
        })

        for (const challenge of openChallenges) {
          try {
            // Accept the challenge
            await prisma.debate.update({
              where: { id: challenge.id },
              data: {
                opponentId: aiUser.id,
                status: 'ACTIVE',
                startedAt: new Date(),
                roundDeadline: new Date(Date.now() + challenge.roundDuration),
              },
            })

            // Create subscription for AI user if needed
            await prisma.userSubscription.upsert({
              where: { userId: aiUser.id },
              update: {},
              create: {
                userId: aiUser.id,
                tier: 'FREE',
                status: 'ACTIVE',
                billingCycle: null,
              },
            })

            // Create notification for challenger
            await prisma.notification.create({
              data: {
                userId: challenge.challenger.id,
                type: 'DEBATE_ACCEPTED',
                title: 'Challenge Accepted',
                message: `${aiUser.username} has accepted your challenge: ${challenge.topic}`,
                debateId: challenge.id,
              },
            })

            console.log(`[AI Tasks] ✅ ${aiUser.username} accepted challenge from ${challenge.challenger.username}: ${challenge.topic.substring(0, 50)}...`)

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

      for (const aiUser of aiUsers) {
        // Find active debates where it's the AI user's turn
        const activeDebates = await prisma.debate.findMany({
          where: {
            status: 'ACTIVE',
            OR: [
              { challengerId: aiUser.id },
              { opponentId: aiUser.id },
            ],
          },
          include: {
            challenger: {
              select: {
                id: true,
                username: true,
                eloRating: true,
              },
            },
            opponent: {
              select: {
                id: true,
                username: true,
                eloRating: true,
              },
            },
            statements: {
              orderBy: [
                { round: 'asc' },
                { createdAt: 'asc' },
              ],
              take: 10, // Get last 10 statements for context
            },
          },
        })

        for (const debate of activeDebates) {
          try {
            // Skip if no opponent (shouldn't happen for ACTIVE debates, but TypeScript safety)
            if (!debate.opponentId) continue

            // Determine whose turn it is
            const lastStatement = debate.statements[debate.statements.length - 1]
            const isChallengerTurn = !lastStatement || lastStatement.authorId === debate.opponentId
            const isAITurn = (isChallengerTurn && debate.challengerId === aiUser.id) ||
                            (!isChallengerTurn && debate.opponentId === aiUser.id)

            if (!isAITurn) continue

            // Check if deadline has passed or it's time to respond
            const now = new Date()
            if (debate.roundDeadline && debate.roundDeadline > now) {
              continue // Not time yet
            }

            // Check if enough time has passed since opponent's last statement (only when responding, not when going first)
            const delayMs = aiUser.aiResponseDelay || 150000 // Default 2.5 minutes (150000ms)
            const isChallenger = debate.challengerId === aiUser.id
            
            // Get statements for current round
            const challengerStatement = await prisma.statement.findFirst({
              where: {
                debateId: debate.id,
                authorId: debate.challengerId,
                round: debate.currentRound,
              },
            })
            
            const opponentStatement = debate.opponentId ? await prisma.statement.findFirst({
              where: {
                debateId: debate.id,
                authorId: debate.opponentId,
                round: debate.currentRound,
              },
            }) : null
            
            // Only apply delay when AI is responding to opponent's statement (not when going first)
            if (isChallenger && opponentStatement) {
              // AI is challenger responding to opponent - check delay
              const statementAge = now.getTime() - new Date(opponentStatement.createdAt).getTime()
              if (statementAge < delayMs) {
                // Not enough time has passed, skip this debate
                const minutesRemaining = Math.ceil((delayMs - statementAge) / 60000)
                console.log(`[AI Tasks] ${aiUser.username} waiting ${minutesRemaining} more minute(s) before responding to debate ${debate.id}`)
                continue
              }
            } else if (!isChallenger && challengerStatement) {
              // AI is opponent responding to challenger - check delay
              const statementAge = now.getTime() - new Date(challengerStatement.createdAt).getTime()
              if (statementAge < delayMs) {
                // Not enough time has passed, skip this debate
                const minutesRemaining = Math.ceil((delayMs - statementAge) / 60000)
                console.log(`[AI Tasks] ${aiUser.username} waiting ${minutesRemaining} more minute(s) before responding to debate ${debate.id}`)
                continue
              }
            }
            // If AI is going first (no opponent statement yet), no delay needed

            // Generate AI response
            const aiResponse = await generateAIResponse(
              debate.id,
              aiUser.id,
              debate.currentRound
            )

            // Submit the statement
            const statement = await prisma.statement.create({
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

            // Determine opponent ID and send notification
            const opponentId = debate.challengerId === aiUser.id ? debate.opponentId : debate.challengerId

            // Send push notification to opponent (non-blocking)
            const { sendYourTurnPushNotification } = await import('@/lib/notifications/push-notifications')
            sendYourTurnPushNotification(opponentId, debate.id, debate.topic).catch((error) => {
              console.error('[AI Tasks] Failed to send push notification:', error)
            })

            console.log(`[AI Tasks] ✅ ${aiUser.username} submitted response for debate ${debate.id} round ${debate.currentRound}`)

            // Check if both users have submitted for this round
            // Note: challengerStatement and opponentStatement are already fetched above (lines 179-193)
            // We need to refetch to get the latest state after AI submission
            const challengerStatementAfter = await prisma.statement.findFirst({
              where: {
                debateId: debate.id,
                round: debate.currentRound,
                authorId: debate.challengerId,
              },
            })

            const opponentStatementAfter = debate.opponentId ? await prisma.statement.findFirst({
              where: {
                debateId: debate.id,
                round: debate.currentRound,
                authorId: debate.opponentId,
              },
            }) : null

            if (challengerStatementAfter && opponentStatementAfter) {
              if (debate.currentRound >= debate.totalRounds) {
                // Debate complete
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
                // Advance to next round
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
      // Check for inactive belts
      const inactiveResult = await checkInactiveBelts()
      results.beltTasks.inactiveBeltsChecked = inactiveResult.beltsMarkedInactive || 0

      // Clean up expired challenges
      const now = new Date()
      const expiredChallenges = await prisma.beltChallenge.updateMany({
        where: {
          status: 'PENDING',
          expiresAt: {
            lt: now,
          },
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
    console.log('[AI Tasks] ========== Cron job complete ==========')
    console.log(`[AI Tasks] Duration: ${duration}ms`)
    console.log(`[AI Tasks] Auto-accepted: ${results.autoAccept.accepted} challenges`)
    console.log(`[AI Tasks] Generated: ${results.responses.generated} responses`)
    console.log(`[AI Tasks] Expired: ${results.beltTasks.expiredChallengesCleaned} belt challenges`)
    console.log(`[AI Tasks] Marked inactive: ${results.beltTasks.inactiveBeltsChecked} belts`)
    if (results.autoAccept.errors.length > 0) {
      console.error(`[AI Tasks] Auto-accept errors: ${results.autoAccept.errors.length}`)
    }
    if (results.responses.errors.length > 0) {
      console.error(`[AI Tasks] Response errors: ${results.responses.errors.length}`)
    }
    if (results.beltTasks.errors.length > 0) {
      console.error(`[AI Tasks] Belt task errors: ${results.beltTasks.errors.length}`)
    }

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

