import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { getUserIdFromSession } from '@/lib/auth/session-utils'

// GET /api/debates/[id]/chat - Get chat messages for a debate
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession()
    const userId = getUserIdFromSession(session)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: debateId } = await params

    // Verify user is participant in the debate
    const debate = await prisma.debate.findUnique({
      where: { id: debateId },
      select: {
        challengerId: true,
        opponentId: true,
      },
    })

    if (!debate) {
      return NextResponse.json({ error: 'Debate not found' }, { status: 404 })
    }

    if (debate.challengerId !== userId && debate.opponentId !== userId) {
      return NextResponse.json(
        { error: 'You are not a participant in this debate' },
        { status: 403 }
      )
    }

    // Get chat messages
    const messages = await prisma.chatMessage.findMany({
      where: { debateId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Failed to fetch chat messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat messages' },
      { status: 500 }
    )
  }
}

// POST /api/debates/[id]/chat - Send a chat message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession()
    const userId = getUserIdFromSession(session)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: debateId } = await params
    const { content } = await request.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: 'Message is too long (max 1000 characters)' },
        { status: 400 }
      )
    }

    // Verify user is participant in the debate
    const debate = await prisma.debate.findUnique({
      where: { id: debateId },
      select: {
        challengerId: true,
        opponentId: true,
        status: true,
      },
    })

    if (!debate) {
      return NextResponse.json({ error: 'Debate not found' }, { status: 404 })
    }

    if (debate.challengerId !== userId && debate.opponentId !== userId) {
      return NextResponse.json(
        { error: 'You are not a participant in this debate' },
        { status: 403 }
      )
    }

    // Only allow chat in active debates
    if (debate.status !== 'ACTIVE' && debate.status !== 'COMPLETED' && debate.status !== 'VERDICT_READY') {
      return NextResponse.json(
        { error: 'Chat is only available for active or completed debates' },
        { status: 400 }
      )
    }

    // Create message
    const message = await prisma.chatMessage.create({
      data: {
        debateId,
        authorId: userId,
        content: content.trim(),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Failed to send chat message:', error)
    return NextResponse.json(
      { error: 'Failed to send chat message' },
      { status: 500 }
    )
  }
}

