import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { getUserIdFromSession } from '@/lib/auth/session-utils'

// GET /api/messages/conversations/[id]/messages - Get messages in a conversation
export async function GET(
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

    // Verify user is part of the conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: params.id },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const messages = await prisma.directMessage.findMany({
      where: {
        conversationId: params.id,
        OR: [
          { deletedBySender: false, senderId: userId },
          { deletedByReceiver: false, receiverId: userId },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        receiver: {
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

    // Mark messages as read
    await prisma.directMessage.updateMany({
      where: {
        conversationId: params.id,
        receiverId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })

    // Update last read timestamp
    if (conversation.user1Id === userId) {
      await prisma.conversation.update({
        where: { id: params.id },
        data: { user1LastReadAt: new Date() },
      })
    } else {
      await prisma.conversation.update({
        where: { id: params.id },
        data: { user2LastReadAt: new Date() },
      })
    }

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Failed to fetch messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST /api/messages/conversations/[id]/messages - Send a message
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
    const { content } = body

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    // Verify user is part of the conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: params.id },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const receiverId = conversation.user1Id === userId 
      ? conversation.user2Id 
      : conversation.user1Id

    // Create message
    const message = await prisma.directMessage.create({
      data: {
        conversationId: params.id,
        senderId: userId,
        receiverId,
        content: content.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    })

    // Update conversation's last message
    await prisma.conversation.update({
      where: { id: params.id },
      data: {
        lastMessageId: message.id,
        lastMessageAt: message.createdAt,
      },
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error('Failed to send message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

