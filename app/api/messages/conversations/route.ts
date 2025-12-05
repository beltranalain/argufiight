import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { getUserIdFromSession } from '@/lib/auth/session-utils'

// GET /api/messages/conversations - Get user's conversations
export async function GET(request: NextRequest) {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = getUserIdFromSession(session)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId },
        ],
      },
      include: {
        user1: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        user2: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
    })

    // Get unread counts for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv.user1Id === userId ? conv.user2Id : conv.user1Id
        const lastReadAt = conv.user1Id === userId 
          ? conv.user1LastReadAt 
          : conv.user2LastReadAt

        const unreadCount = await prisma.directMessage.count({
          where: {
            conversationId: conv.id,
            receiverId: userId,
            isRead: false,
            createdAt: lastReadAt ? { gt: lastReadAt } : undefined,
          },
        })

        return {
          ...conv,
          unreadCount,
          otherUser: conv.user1Id === userId ? conv.user2 : conv.user1,
        }
      })
    )

    return NextResponse.json({ conversations: conversationsWithUnread })
  } catch (error) {
    console.error('Failed to fetch conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

// POST /api/messages/conversations - Create or get conversation with a user
export async function POST(request: NextRequest) {
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
    const { otherUserId } = body

    if (!otherUserId || otherUserId === userId) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    // Check if conversation already exists
    const existing = await prisma.conversation.findFirst({
      where: {
        OR: [
          { user1Id: userId, user2Id: otherUserId },
          { user1Id: otherUserId, user2Id: userId },
        ],
      },
      include: {
        user1: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        user2: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    })

    if (existing) {
      return NextResponse.json({ conversation: existing })
    }

    // Create new conversation (always put smaller ID first for consistency)
    const [user1Id, user2Id] = userId < otherUserId 
      ? [userId, otherUserId]
      : [otherUserId, userId]

    const conversation = await prisma.conversation.create({
      data: {
        user1Id,
        user2Id,
      },
      include: {
        user1: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        user2: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    })

    return NextResponse.json({ conversation }, { status: 201 })
  } catch (error) {
    console.error('Failed to create conversation:', error)
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    )
  }
}

