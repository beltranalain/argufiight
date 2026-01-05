import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { generateAIResponse } from '@/lib/ai/ai-user-responses'
import { calculateWordCount, updateUserAnalyticsOnStatement } from '@/lib/utils/analytics'

// Cron job to generate AI responses for active debates
// This should be called periodically (e.g., every 5-10 minutes)
// Also called on-demand when debates are viewed/submitted
export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (optional - only if CRON_SECRET is set)
    // Allow on-demand triggers from internal API routes without auth
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    // Only require auth if CRON_SECRET is set and request is from external cron service
    // Internal on-demand triggers (from /api/debates routes) don't need auth
    if (cronSecret && authHeader && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all active AI users
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

    if (aiUsers.length === 0) {
      return NextResponse.json({ message: 'No active AI users', responses: 0 })
    }

    let responsesGenerated = 0
    const startTime = Date.now()

    console.log(`[AI Response Generation] Starting at ${new Date().toISOString()}`)
    console.log(`[AI Response Generation] Found ${aiUsers.length} active AI user(s)`)

    // For each AI user, find debates where it's their turn
    for (const aiUser of aiUsers) {
      console.log(`[AI Response Generation] Processing AI user: ${aiUser.username}`)
      // Find active debates where:
      // 1. AI user is a participant (challenger or opponent)
      // 2. Debate is ACTIVE
      // 3. AI user hasn't submitted for current round yet
      const activeDebates = await prisma.debate.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { challengerId: aiUser.id },
            { opponentId: aiUser.id },
          ],
        },
        include: {
          statements: {
            where: {
              round: {
                // Get current round
                // We'll check this in the loop
              },
            },
          },
        },
      })

      for (const debate of activeDebates) {
        try {
          // Check if AI user already submitted for this round
          const existingStatement = await prisma.statement.findUnique({
            where: {
              debateId_authorId_round: {
                debateId: debate.id,
                authorId: aiUser.id,
                round: debate.currentRound,
              },
            },
          })

          if (existingStatement) {
            continue // Already submitted
          }

          // Check if it's the AI user's turn
          // If challenger submitted, opponent should respond (and vice versa)
          const challengerStatement = await prisma.statement.findUnique({
            where: {
              debateId_authorId_round: {
                debateId: debate.id,
                authorId: debate.challengerId,
                round: debate.currentRound,
              },
            },
          })

          const opponentStatement = debate.opponentId ? await prisma.statement.findUnique({
            where: {
              debateId_authorId_round: {
                debateId: debate.id,
                authorId: debate.opponentId,
                round: debate.currentRound,
              },
            },
          }) : null

          // Determine if it's AI user's turn
          const isChallenger = debate.challengerId === aiUser.id
          const isOpponent = debate.opponentId === aiUser.id

          let shouldRespond = false
          
          if (isChallenger) {
            // Challenger goes first in each round
            if (!challengerStatement) {
              shouldRespond = true
            }
          } else if (isOpponent) {
            // Opponent responds after challenger
            if (challengerStatement && !opponentStatement) {
              shouldRespond = true
            }
          }

          if (!shouldRespond) {
            continue
          }

          // Check if enough time has passed since opponent's last statement (only when responding, not when going first)
          // Reduced delay for better responsiveness - AI should respond within 1 minute of opponent's statement
          const delayMs = Math.min(aiUser.aiResponseDelay || 60000, 60000) // Max 1 minute delay (60000ms)
          const now = new Date()
          
          // Only apply delay when AI is responding to opponent's statement (not when going first)
          if (isOpponent && challengerStatement) {
            // AI is opponent responding to challenger - check delay
            const statementAge = now.getTime() - new Date(challengerStatement.createdAt).getTime()
            if (statementAge < delayMs) {
              // Not enough time has passed, skip this debate
              const secondsRemaining = Math.ceil((delayMs - statementAge) / 1000)
              console.log(`[AI Response] ${aiUser.username} waiting ${secondsRemaining} more second(s) before responding to debate ${debate.id}`)
              continue
            }
          } else if (isChallenger && opponentStatement) {
            // AI is challenger responding to opponent - check delay
            const statementAge = now.getTime() - new Date(opponentStatement.createdAt).getTime()
            if (statementAge < delayMs) {
              // Not enough time has passed, skip this debate
              const secondsRemaining = Math.ceil((delayMs - statementAge) / 1000)
              console.log(`[AI Response] ${aiUser.username} waiting ${secondsRemaining} more second(s) before responding to debate ${debate.id}`)
              continue
            }
          }
          // If AI is going first (no opponent statement yet), no delay needed

          console.log(`[AI Response Generation] ${aiUser.username} generating response for debate ${debate.id} (Round ${debate.currentRound})`)

          // Generate AI response
          const response = await generateAIResponse(debate.id, aiUser.id, debate.currentRound)

          console.log(`[AI Response Generation] ${aiUser.username} generated response (${response.length} chars)`)

          // Create statement
          const statement = await prisma.statement.create({
            data: {
              debateId: debate.id,
              authorId: aiUser.id,
              round: debate.currentRound,
              content: response.trim(),
            },
          })

          console.log(`[AI Response Generation] ${aiUser.username} created statement ${statement.id}`)

          // Update user analytics
          const wordCount = calculateWordCount(response)
          await updateUserAnalyticsOnStatement(aiUser.id, wordCount)

          console.log(`[AI Response Generation] ${aiUser.username} completed. Total responses: ${responsesGenerated + 1}`)

          // Check if both participants have submitted for this round
          console.log(`[AI Response Generation] Checking if both participants submitted for round ${debate.currentRound}`)
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

          console.log(`[AI Response Generation] Round ${debate.currentRound} status:`, {
            challengerSubmitted: !!updatedChallengerStatement,
            opponentSubmitted: !!updatedOpponentStatement,
            bothSubmitted: !!(updatedChallengerStatement && updatedOpponentStatement),
          })

          // If both have submitted, advance to next round or complete
          if (updatedChallengerStatement && updatedOpponentStatement) {
            console.log(`[AI Response Generation] Both participants submitted for round ${debate.currentRound}`)
            
            if (debate.currentRound >= debate.totalRounds) {
              // Debate complete, mark as COMPLETED
              console.log(`[AI Response Generation] Debate ${debate.id} completed (final round)`)
              await prisma.debate.update({
                where: { id: debate.id },
                data: {
                  status: 'COMPLETED',
                  endedAt: new Date(),
                },
              })

              // Trigger verdict generation automatically
              console.log(`[AI Response Cron] Debate ${debate.id} completed, triggering verdict generation`)
              import('@/lib/verdicts/generate-initial').then(async (generateModule) => {
                try {
                  console.log(`[AI Response Cron] Starting verdict generation for debate ${debate.id}`)
                  await generateModule.generateInitialVerdicts(debate.id)
                  console.log(`[AI Response Cron] ✅ Verdict generation completed for debate ${debate.id}`)
                  
                  // Update debate status to VERDICT_READY after successful generation
                  await prisma.debate.update({
                    where: { id: debate.id },
                    data: { status: 'VERDICT_READY' },
                  })
                  console.log(`[AI Response Cron] ✅ Debate ${debate.id} status updated to VERDICT_READY`)
                } catch (error: any) {
                  console.error(`[AI Response Cron] ❌ Failed to generate verdicts for debate ${debate.id}:`, error.message)
                  console.error(`[AI Response Cron] Error stack:`, error.stack)
                  // Don't throw - allow debate to remain COMPLETED for manual retry
                }
              }).catch((importError: any) => {
                console.error(`[AI Response Cron] ❌ Failed to import verdict generation module:`, importError.message)
                console.error(`[AI Response Cron] Import error stack:`, importError.stack)
              })
            } else {
              // Advance to next round
              const newRound = debate.currentRound + 1
              const newDeadline = new Date(Date.now() + debate.roundDuration)
              console.log(`[AI Response Generation] Advancing debate ${debate.id} to round ${newRound}`)
              
              await prisma.debate.update({
                where: { id: debate.id },
                data: {
                  currentRound: newRound,
                  roundDeadline: newDeadline,
                },
              })
              
              console.log(`[AI Response Generation] ✅ Debate advanced to round ${newRound}, deadline: ${newDeadline}`)
            }
          } else {
            console.log(`[AI Response Generation] Waiting for other participant to submit`)
          }

          responsesGenerated++
        } catch (error) {
          console.error(`Failed to generate response for debate ${debate.id} by AI user ${aiUser.id}:`, error)
          // Continue with next debate
        }
      }
    }

    return NextResponse.json({
      message: 'AI response generation completed',
      responses: responsesGenerated,
      aiUsersChecked: aiUsers.length,
    })
  } catch (error: any) {
    console.error('Failed to generate AI responses:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate AI responses' },
      { status: 500 }
    )
  }
}

