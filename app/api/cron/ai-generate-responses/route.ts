import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { generateAIResponse } from '@/lib/ai/ai-user-responses'
import { calculateWordCount, updateUserAnalyticsOnStatement } from '@/lib/utils/analytics'

// Cron job to generate AI responses for active debates
// This should be called periodically (e.g., every 5-10 minutes)
export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
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
      },
    })

    if (aiUsers.length === 0) {
      return NextResponse.json({ message: 'No active AI users', responses: 0 })
    }

    let responsesGenerated = 0

    // For each AI user, find debates where it's their turn
    for (const aiUser of aiUsers) {
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

          // Generate AI response
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

