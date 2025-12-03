import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { getUserIdFromSession } from '@/lib/auth/session-utils'

// POST /api/debates/[id]/accept - Accept challenge
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const userId = getUserIdFromSession(session)
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is suspended
    const user = await prisma.user.findUnique({
      where: { id: userId || undefined },
      select: { id: true, bannedUntil: true, username: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user is currently suspended
    if (user.bannedUntil && new Date(user.bannedUntil) > new Date()) {
      const daysRemaining = Math.ceil((new Date(user.bannedUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      return NextResponse.json(
        { 
          error: 'You are currently suspended from debating',
          suspensionDaysRemaining: daysRemaining,
          suspensionEndDate: user.bannedUntil,
        },
        { status: 403 }
      )
    }

    console.log('Accept challenge request:', { debateId: id, userId })

    const debate = await prisma.debate.findUnique({
      where: { id },
    })

    if (!debate) {
      console.error('Debate not found:', id)
      return NextResponse.json(
        { error: 'Debate not found' },
        { status: 404 }
      )
    }

    console.log('Debate found:', {
      id: debate.id,
      status: debate.status,
      challengerId: debate.challengerId,
      opponentId: debate.opponentId,
      challengeType: debate.challengeType,
      invitedUserIds: debate.invitedUserIds,
    })

    if (debate.status !== 'WAITING') {
      console.error('Debate not in WAITING status:', debate.status)
      return NextResponse.json(
        { error: `Debate is not available for acceptance. Current status: ${debate.status}` },
        { status: 400 }
      )
    }

    if (debate.challengerId === userId) {
      console.error('User trying to accept their own challenge')
      return NextResponse.json(
        { error: 'Cannot accept your own challenge' },
        { status: 400 }
      )
    }

    // Check if debate already has an opponent
    if (debate.opponentId) {
      console.error('Debate already has an opponent:', debate.opponentId)
      return NextResponse.json(
        { error: 'This challenge has already been accepted by another user' },
        { status: 400 }
      )
    }

    // For direct/group challenges, verify user is invited
    if (debate.challengeType === 'DIRECT' || debate.challengeType === 'GROUP') {
      if (!debate.invitedUserIds) {
        console.error('Direct/Group challenge has no invitedUserIds')
        return NextResponse.json(
          { error: 'This challenge has no invited users' },
          { status: 400 }
        )
      }

      let invitedIds: string[]
      try {
        invitedIds = JSON.parse(debate.invitedUserIds) as string[]
      } catch (error) {
        console.error('Failed to parse invitedUserIds:', debate.invitedUserIds, error)
        return NextResponse.json(
          { error: 'Invalid challenge invitation data' },
          { status: 400 }
        )
      }

      if (!Array.isArray(invitedIds)) {
        console.error('invitedUserIds is not an array:', invitedIds)
        return NextResponse.json(
          { error: 'Invalid challenge invitation format' },
          { status: 400 }
        )
      }

      if (!invitedIds.includes(userId)) {
        console.error('User not in invited list:', { userId, invitedIds })
        return NextResponse.json(
          { error: 'You are not invited to this challenge' },
          { status: 403 }
        )
      }
    }

    // Calculate round deadline
    const now = new Date()
    const deadline = new Date(now.getTime() + debate.roundDuration)

    // Update debate
    const updatedDebate = await prisma.debate.update({
      where: { id },
      data: {
        opponentId: userId,
        status: 'ACTIVE',
        startedAt: now,
        currentRound: 1,
        roundDeadline: deadline,
      },
      include: {
        challenger: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            eloRating: true,
          }
        },
        opponent: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            eloRating: true,
          }
        },
      },
    })

    // Notify challenger
    try {
      await prisma.notification.create({
        data: {
          userId: debate.challengerId,
          type: 'DEBATE_ACCEPTED',
          title: 'Challenge Accepted',
          message: `Your challenge "${debate.topic}" has been accepted!`,
          debateId: debate.id,
        },
      })
    } catch (notifError) {
      console.error('Failed to create notification (non-fatal):', notifError)
      // Don't fail the request if notification creation fails
    }

    console.log('Challenge accepted successfully:', updatedDebate.id)
    return NextResponse.json(updatedDebate)
  } catch (error: any) {
    console.error('Failed to accept debate:', error)
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    })
    return NextResponse.json(
      { 
        error: 'Failed to accept debate',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}

