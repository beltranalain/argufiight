import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { headers } from 'next/headers'

// Cron job to auto-accept open challenges for AI users
// This should be called periodically (e.g., every 5-10 minutes)
export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (optional - only if CRON_SECRET is set)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    // Only require auth if CRON_SECRET is set (allows manual testing without auth)
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('[AI Auto-Accept] Starting auto-accept check at:', new Date().toISOString())

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
      const delayMs = aiUser.aiResponseDelay || 3600000 // Default 1 hour (600000 = 10 minutes)
      const cutoffTime = new Date(Date.now() - delayMs)

      console.log(`[AI Auto-Accept] Checking ${aiUser.username} (delay: ${delayMs}ms = ${Math.floor(delayMs / 60000)} minutes)`)

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

      console.log(`[AI Auto-Accept] ${aiUser.username} found ${openChallenges.length} eligible challenge(s)`)
      
      // Log details about each challenge
      openChallenges.forEach((challenge) => {
        const ageMs = Date.now() - new Date(challenge.createdAt).getTime()
        const ageMinutes = Math.floor(ageMs / 60000)
        console.log(`  - "${challenge.topic}" from ${challenge.challenger.username} (age: ${ageMinutes}m)`)
      })

      // Accept challenges
      for (const challenge of openChallenges) {
        try {
          console.log(`[AI Auto-Accept] ${aiUser.username} accepting: "${challenge.topic}"`)
          
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
          
          console.log(`[AI Auto-Accept] ✅ ${aiUser.username} successfully accepted challenge ${challenge.id}`)
        } catch (error: any) {
          console.error(`[AI Auto-Accept] ❌ Failed to accept challenge ${challenge.id} for AI user ${aiUser.id}:`, error)
          // Continue with next challenge
        }
      }
    }

    console.log(`[AI Auto-Accept] Completed: ${acceptedCount} challenge(s) accepted by ${aiUsers.length} AI user(s)`)
    
    return NextResponse.json({
      message: 'Auto-accept completed',
      accepted: acceptedCount,
      aiUsersChecked: aiUsers.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Failed to auto-accept challenges:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to auto-accept challenges' },
      { status: 500 }
    )
  }
}

