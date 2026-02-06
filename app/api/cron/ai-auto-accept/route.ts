import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// Cron job to auto-accept open challenges for AI users
// Also called via after() from the debates list API for real-time processing
export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (optional - only if CRON_SECRET is set)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Only require auth if CRON_SECRET is set and provided
    if (cronSecret && authHeader && authHeader !== `Bearer ${cronSecret}`) {
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
          // Only accept challenges from humans (prevent AI-to-AI)
          challenger: { isAI: false },
        },
        include: {
          challenger: {
            select: { id: true, username: true },
          },
        },
        take: 5,
      })

      for (const challenge of openChallenges) {
        try {
          await prisma.debate.update({
            where: { id: challenge.id },
            data: {
              opponentId: aiUser.id,
              status: 'ACTIVE',
              startedAt: new Date(),
              roundDeadline: new Date(Date.now() + challenge.roundDuration),
            },
          })

          acceptedCount++

          await prisma.notification.create({
            data: {
              userId: challenge.challengerId,
              type: 'DEBATE_ACCEPTED',
              title: 'Challenge Accepted',
              message: `${aiUser.username} accepted your challenge: "${challenge.topic}"`,
              debateId: challenge.id,
            },
          })
        } catch (error: any) {
          console.error(`[AI Auto-Accept] Failed to accept challenge ${challenge.id}:`, error.message)
        }
      }
    }

    return NextResponse.json({
      message: 'Auto-accept completed',
      accepted: acceptedCount,
      aiUsersChecked: aiUsers.length,
    })
  } catch (error: any) {
    console.error('[AI Auto-Accept] Error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Failed to auto-accept challenges' },
      { status: 500 }
    )
  }
}
