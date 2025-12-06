import { PrismaClient } from '@prisma/client'
import { generateAIResponse } from '../lib/ai/ai-user-responses'
import { calculateWordCount, updateUserAnalyticsOnStatement } from '../lib/utils/analytics'

const prisma = new PrismaClient()

async function triggerAIResponse() {
  try {
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
      console.log('No active AI users found.')
      return
    }

    let responsesGenerated = 0

    // For each AI user, find debates where it's their turn
    for (const aiUser of aiUsers) {
      // Find active debates where AI user is a participant
      const activeDebates = await prisma.debate.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { challengerId: aiUser.id },
            { opponentId: aiUser.id },
          ],
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
            console.log(`${aiUser.username}: Already submitted for Round ${debate.currentRound}`)
            continue
          }

          // Check if it's the AI user's turn
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
            console.log(`${aiUser.username}: Not their turn yet`)
            continue
          }

          console.log(`\n${aiUser.username}: Generating response for debate "${debate.topic}"...`)

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

          console.log(`✅ Response generated and submitted!`)

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
              // Debate complete
              await prisma.debate.update({
                where: { id: debate.id },
                data: {
                  status: 'COMPLETED',
                  endedAt: new Date(),
                },
              })
              console.log('✅ Debate completed!')
            } else {
              // Advance to next round
              await prisma.debate.update({
                where: { id: debate.id },
                data: {
                  currentRound: debate.currentRound + 1,
                  roundDeadline: new Date(Date.now() + debate.roundDuration),
                },
              })
              console.log(`✅ Advanced to Round ${debate.currentRound + 1}`)
            }
          }

          responsesGenerated++
        } catch (error) {
          console.error(`❌ Failed to generate response for debate ${debate.id}:`, error)
        }
      }
    }

    console.log(`\n=== Summary ===`)
    console.log(`Responses generated: ${responsesGenerated}`)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

triggerAIResponse()

