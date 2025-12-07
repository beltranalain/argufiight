import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'

// DELETE /api/debates/[id]/delete - Delete a challenge (creator only)
export async function DELETE(
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
        opponent: {
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

    // Check if user is the creator (challenger)
    if (debate.challengerId !== userId) {
      return NextResponse.json(
        { error: 'Only the creator can delete this challenge' },
        { status: 403 }
      )
    }

    // Only allow deletion if debate is in WAITING status (not started yet)
    if (debate.status !== 'WAITING') {
      return NextResponse.json(
        { error: 'You can only delete challenges that have not been accepted yet' },
        { status: 400 }
      )
    }

    // Delete the debate
    await prisma.debate.delete({
      where: { id: debateId },
    })

    // Notify invited users if it was a DIRECT or GROUP challenge
    if ((debate.challengeType === 'DIRECT' || debate.challengeType === 'GROUP') && debate.invitedUserIds) {
      const invitedIds = JSON.parse(debate.invitedUserIds) as string[]
      
      // Create notifications for all invited users
      const notifications = invitedIds.map((invitedUserId) => ({
        userId: invitedUserId,
        type: 'CHALLENGE_CANCELLED' as const,
        title: 'Challenge Cancelled',
        message: `The challenge "${debate.topic}" has been cancelled`,
        debateId: debateId,
      }))

      if (notifications.length > 0) {
        await prisma.notification.createMany({
          data: notifications,
        })
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Challenge deleted successfully',
    })
  } catch (error: any) {
    console.error('Failed to delete challenge:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete challenge' },
      { status: 500 }
    )
  }
}

