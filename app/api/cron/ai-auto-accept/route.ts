import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { headers } from 'next/headers'

// Cron job to auto-accept open challenges for AI users
// This should be called periodically (e.g., every 5-10 minutes)
export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (add your cron secret check here)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      return NextResponse.json({ message: 'No active AI users', accepted: 0 })
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

      // Accept challenges
      for (const challenge of openChallenges) {
        try {
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
        } catch (error) {
          console.error(`Failed to accept challenge ${challenge.id} for AI user ${aiUser.id}:`, error)
          // Continue with next challenge
        }
      }
    }

    return NextResponse.json({
      message: 'Auto-accept completed',
      accepted: acceptedCount,
      aiUsersChecked: aiUsers.length,
    })
  } catch (error: any) {
    console.error('Failed to auto-accept challenges:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to auto-accept challenges' },
      { status: 500 }
    )
  }
}

