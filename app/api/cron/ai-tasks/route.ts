import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { generateAIResponse } from '@/lib/ai/ai-user-responses'
import { calculateWordCount, updateUserAnalyticsOnStatement } from '@/lib/utils/analytics'

// Combined AI tasks endpoint - handles both auto-accept and response generation
// This can be called more frequently via external cron services
export async function GET(request: NextRequest) {
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

            // Generate AI response
            const aiResponse = await generateAIResponse(
              debate.id,
              aiUser.id,
              debate.currentRound
            )

            // Submit the statement
            const wordCount = calculateWordCount(aiResponse)
            const statement = await prisma.statement.create({
              data: {
                debateId: debate.id,
                authorId: aiUser.id,
                content: aiResponse,
                round: debate.currentRound,
                wordCount,
              },
            })

            // Update analytics
            await updateUserAnalyticsOnStatement(aiUser.id, wordCount)

            // Check if both users have submitted for this round
            const challengerStatement = await prisma.statement.findFirst({
              where: {
                debateId: debate.id,
                round: debate.currentRound,
                authorId: debate.challengerId,
              },
            })

            const opponentStatement = await prisma.statement.findFirst({
              where: {
                debateId: debate.id,
                round: debate.currentRound,
                authorId: debate.opponentId,
              },
            })

            if (challengerStatement && opponentStatement) {
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

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
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

