import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function triggerAIAutoAccept() {
  try {
    // Get all active, non-paused AI users
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
      console.log('No active AI users found.')
      return
    }

    let acceptedCount = 0

    // For each AI user, find open challenges that are older than their response delay
    for (const aiUser of aiUsers) {
      const delayMs = aiUser.aiResponseDelay || 3600000 // Default 1 hour
      const cutoffTime = new Date(Date.now() - delayMs)

      // Find open challenges that:
      // 1. Are waiting for an opponent (status = WAITING)
      // 2. Were created before the cutoff time
      // 3. Are not already accepted by this AI user
      // 4. The challenger is not this AI user
      const openChallenges = await prisma.debate.findMany({
        where: {
          status: 'WAITING',
          challengeType: 'OPEN',
          createdAt: {
            lte: cutoffTime,
          },
          challengerId: {
            not: aiUser.id, // Don't accept your own challenges
          },
          opponentId: null,
        },
        include: {
          challenger: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        take: 5, // Limit to 5 per AI user per run
      })

      console.log(`\n${aiUser.username} found ${openChallenges.length} eligible challenge(s)`)

      // Accept challenges
      for (const challenge of openChallenges) {
        try {
          console.log(`  Accepting: "${challenge.topic}" from ${challenge.challenger.username}`)
          
          // Update debate to set AI user as opponent
          await prisma.debate.update({
            where: { id: challenge.id },
            data: {
              opponentId: aiUser.id,
              status: 'ACTIVE',
              startedAt: new Date(),
              // Set round deadline based on debate settings
              roundDeadline: new Date(
                Date.now() + challenge.roundDuration
              ),
            },
          })

          acceptedCount++

          // Create notification for the challenger
          await prisma.notification.create({
            data: {
              userId: challenge.challengerId,
              type: 'DEBATE_ACCEPTED',
              title: 'Challenge Accepted',
              message: `${aiUser.username} accepted your challenge: "${challenge.topic}"`,
              debateId: challenge.id,
            },
          })

          console.log(`  ✅ Successfully accepted challenge ${challenge.id}`)
        } catch (error) {
          console.error(`  ❌ Failed to accept challenge ${challenge.id}:`, error)
          // Continue with next challenge
        }
      }
    }

    console.log(`\n=== Summary ===`)
    console.log(`AI users checked: ${aiUsers.length}`)
    console.log(`Challenges accepted: ${acceptedCount}`)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

triggerAIAutoAccept()

