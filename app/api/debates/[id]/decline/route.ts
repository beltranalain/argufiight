import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'

// POST /api/debates/[id]/decline - Decline a challenge invitation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: debateId } = await params
    const userId = getUserIdFromSession(session)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const debate = await prisma.debate.findUnique({
      where: { id: debateId },
      include: {
        challenger: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    })

    if (!debate) {
      return NextResponse.json({ error: 'Debate not found' }, { status: 404 })
    }

    // Check if debate is in WAITING status
    if (debate.status !== 'WAITING') {
      return NextResponse.json(
        { error: 'This challenge is no longer available' },
        { status: 400 }
      )
    }

    // Check if user is invited (for DIRECT or GROUP challenges)
    if (debate.challengeType === 'DIRECT' || debate.challengeType === 'GROUP') {
      if (!debate.invitedUserIds) {
        return NextResponse.json(
          { error: 'This challenge has no invited users' },
          { status: 400 }
        )
      }

      const invitedIds = JSON.parse(debate.invitedUserIds) as string[]
      if (!invitedIds.includes(userId)) {
        return NextResponse.json(
          { error: 'You are not invited to this challenge' },
          { status: 403 }
        )
      }

      // Remove user from invited list
      const updatedInvitedIds = invitedIds.filter((id) => id !== userId)
      
      // If no more invited users and it's a DIRECT challenge, cancel the debate
      if (updatedInvitedIds.length === 0 || (debate.challengeType === 'DIRECT' && updatedInvitedIds.length === 0)) {
        await prisma.debate.update({
          where: { id: debateId },
          data: {
            status: 'CANCELLED',
            invitedUserIds: null,
          },
        })
      } else {
        // Update invited list
        await prisma.debate.update({
          where: { id: debateId },
          data: {
            invitedUserIds: JSON.stringify(updatedInvitedIds),
          },
        })
      }

      // Send notification to challenger
      await prisma.notification.create({
        data: {
          userId: debate.challengerId,
          type: 'CHALLENGE_DECLINED',
          title: 'Challenge Declined',
          message: `Your challenge "${debate.topic}" was declined`,
          debateId: debateId,
        },
      })

      return NextResponse.json({ 
        success: true,
        message: 'Challenge declined',
      })
    }

    // For OPEN challenges, user can't decline (they just don't accept)
    return NextResponse.json(
      { error: 'You can only decline direct or group challenges you were invited to' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Failed to decline challenge:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to decline challenge' },
      { status: 500 }
    )
  }
}

