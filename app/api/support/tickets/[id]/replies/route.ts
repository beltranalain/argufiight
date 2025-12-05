import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { getUserIdFromSession } from '@/lib/auth/session-utils'

// POST /api/support/tickets/[id]/replies - Add a reply to a support ticket
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = getUserIdFromSession(session)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, isInternal } = body

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // Check if ticket exists and user has access
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.id },
      select: {
        userId: true,
        status: true,
      },
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Check if user owns the ticket or is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    })

    if (ticket.userId !== userId && !user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Only admins can create internal notes
    if (isInternal && !user?.isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can create internal notes' },
        { status: 403 }
      )
    }

    // Create reply
    const reply = await prisma.supportTicketReply.create({
      data: {
        ticketId: params.id,
        authorId: userId,
        content,
        isInternal: isInternal || false,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            isAdmin: true,
          },
        },
      },
    })

    // Update ticket status if user replied (not admin)
    if (!user?.isAdmin && ticket.status === 'RESOLVED') {
      await prisma.supportTicket.update({
        where: { id: params.id },
        data: { status: 'OPEN' },
      })
    }

    return NextResponse.json({ reply }, { status: 201 })
  } catch (error) {
    console.error('Failed to create support ticket reply:', error)
    return NextResponse.json(
      { error: 'Failed to create reply' },
      { status: 500 }
    )
  }
}

