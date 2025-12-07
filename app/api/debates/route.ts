import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import crypto from 'crypto'

// GET /api/debates - List debates
export async function GET(request: NextRequest) {
  try {
    // Process expired rounds in the background (non-blocking)
    // This ensures expired rounds are processed when debates are fetched
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/debates/process-expired`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {
      // Silently fail - this is a background task
    })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const userId = searchParams.get('userId')
    const shareToken = searchParams.get('shareToken') // For accessing private debates
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100) // Max 100 per page
    const skip = (page - 1) * limit
    
    // Get current user session for access control
    const session = await verifySession()
    const currentUserId = session ? getUserIdFromSession(session) : null

    const where: any = {}

    if (status && status !== 'ALL') {
      // Handle comma-separated statuses (e.g., "COMPLETED,VERDICT_READY")
      if (status.includes(',')) {
        where.status = {
          in: status.split(',').map(s => s.trim())
        }
      } else {
        where.status = status
      }
    }

    if (category && category !== 'ALL') {
      where.category = category
    }

    if (userId) {
      where.OR = [
        { challengerId: userId },
        { opponentId: userId }
      ]
    }

    // Privacy filtering: Exclude private debates unless:
    // 1. User is a participant (challenger or opponent)
    // 2. shareToken matches
    // 3. User is querying their own debates (userId matches currentUserId)
    if (!shareToken && (!userId || userId !== currentUserId)) {
      where.isPrivate = false // Only show public debates in general listings
    } else if (shareToken) {
      // If shareToken is provided, only return debates with matching token
      where.shareToken = shareToken
    } else if (userId && userId === currentUserId) {
      // User viewing their own debates - show all (public and private)
      // No additional filter needed
    }

    // Get total count for pagination
    const total = await prisma.debate.count({ where })

    const debates = await prisma.debate.findMany({
      where,
      select: {
        id: true,
        topic: true,
        category: true,
        status: true,
        challengerId: true,
        opponentId: true,
        winnerId: true,
        endedAt: true,
        createdAt: true,
        challengeType: true,
        invitedUserIds: true,
        currentRound: true,
        totalRounds: true,
        roundDeadline: true,
        spectatorCount: true,
        challengerPosition: true,
        opponentPosition: true,
        isPrivate: true,
        shareToken: true,
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
        images: {
          select: {
            id: true,
            url: true,
            alt: true,
            caption: true,
            order: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
        statements: {
          select: {
            id: true,
            round: true,
            authorId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    })

    return NextResponse.json({
      debates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Failed to fetch debates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch debates' },
      { status: 500 }
    )
  }
}

// POST /api/debates - Create debate
export async function POST(request: NextRequest) {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      topic, 
      description, 
      category, 
      challengerPosition, 
      totalRounds, 
      speedMode,
      allowCopyPaste = true,
      isPrivate = false,
      challengeType = 'OPEN',
      invitedUserIds = null,
    } = body

    // Validate required fields
    if (!topic || !category || !challengerPosition) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate challenge type
    if (!['OPEN', 'DIRECT', 'GROUP'].includes(challengeType)) {
      return NextResponse.json(
        { error: 'Invalid challenge type' },
        { status: 400 }
      )
    }

    // Validate direct/group challenge requirements
    if (challengeType === 'DIRECT') {
      if (!invitedUserIds || !Array.isArray(invitedUserIds) || invitedUserIds.length !== 1) {
        return NextResponse.json(
          { error: 'Direct challenge requires exactly one invited user' },
          { status: 400 }
        )
      }
    }

    if (challengeType === 'GROUP') {
      if (!invitedUserIds || !Array.isArray(invitedUserIds) || invitedUserIds.length === 0) {
        return NextResponse.json(
          { error: 'Group challenge requires at least one invited user' },
          { status: 400 }
        )
      }
      if (invitedUserIds.length > 10) {
        return NextResponse.json(
          { error: 'Group challenge can have at most 10 invited users' },
          { status: 400 }
        )
      }
    }

    // Get userId first
    const userId = getUserIdFromSession(session)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if challenger is suspended
    const challenger = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, bannedUntil: true, username: true },
    })

    if (!challenger) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if challenger is currently suspended
    if (challenger.bannedUntil && new Date(challenger.bannedUntil) > new Date()) {
      const daysRemaining = Math.ceil((new Date(challenger.bannedUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      return NextResponse.json(
        { 
          error: 'You are currently suspended from debating',
          suspensionDaysRemaining: daysRemaining,
          suspensionEndDate: challenger.bannedUntil,
        },
        { status: 403 }
      )
    }

    // Verify invited users exist and are not suspended
    if (invitedUserIds && invitedUserIds.length > 0) {
      const invitedUsers = await prisma.user.findMany({
        where: {
          id: { in: invitedUserIds },
        },
        select: { id: true, username: true, bannedUntil: true },
      })

      if (invitedUsers.length !== invitedUserIds.length) {
        return NextResponse.json(
          { error: 'One or more invited users not found' },
          { status: 400 }
        )
      }

      // Check if any invited users are suspended
      const suspendedUsers = invitedUsers.filter(user => 
        user.bannedUntil && new Date(user.bannedUntil) > new Date()
      )

      if (suspendedUsers.length > 0) {
        return NextResponse.json(
          { 
            error: `One or more invited users are currently suspended: ${suspendedUsers.map(u => u.username).join(', ')}`,
          },
          { status: 400 }
        )
      }
    }

    // Determine opponent position (opposite of challenger)
    const opponentPosition = challengerPosition === 'FOR' ? 'AGAINST' : 'FOR'

    // Calculate round duration (24 hours default, 1 hour for speed mode)
    const roundDuration = speedMode ? 3600000 : 86400000 // milliseconds

    // For direct challenges, set the opponent immediately
    let opponentId = null
    if (challengeType === 'DIRECT' && invitedUserIds && invitedUserIds.length === 1) {
      opponentId = invitedUserIds[0]
    }

    // Generate share token for private debates
    let shareToken = null
    if (isPrivate) {
      // Generate a secure random token (32 characters, URL-safe)
      shareToken = crypto.randomBytes(24).toString('base64url')
    }

    // Try to create debate with Prisma first
    let debate
    try {
      debate = await prisma.debate.create({
        data: {
          topic,
          description: description || null,
          category: category as any, // Cast to enum type
          challengerId: userId,
          challengerPosition,
          opponentPosition,
          opponentId,
          totalRounds: totalRounds || 5,
          roundDuration,
          speedMode: speedMode || false,
          allowCopyPaste: allowCopyPaste !== false, // Default to true
          isPrivate: isPrivate || false,
          shareToken,
          challengeType,
          invitedUserIds: invitedUserIds ? JSON.stringify(invitedUserIds) : null,
          invitedBy: challengeType !== 'OPEN' ? userId : null,
          status: challengeType === 'DIRECT' ? 'WAITING' : 'WAITING',
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
        },
      })
    } catch (error: any) {
      // If Prisma fails due to enum constraint (e.g., MUSIC not in enum) or missing column, use raw SQL
      if (error.message?.includes('Invalid value for enum') || 
          error.message?.includes('Unknown arg') ||
          error.message?.includes('does not exist') ||
          error.code === 'P2003' ||
          error.code === 'P2022') {
        console.log('Category not in enum, using raw SQL:', category)
        
        const debateId = crypto.randomUUID()
        const now = new Date().toISOString()
        
        // Get list of columns that exist in the database
        const columns = await prisma.$queryRawUnsafe<Array<{ name: string }>>(`
          PRAGMA table_info(debates)
        `)
        const columnNames = columns.map(c => c.name)
        
        // Build dynamic INSERT statement based on existing columns
        const insertColumns = [
          'id', 'topic', 'description', 'category', 'challenger_id', 'challenger_position',
          'opponent_position', 'opponent_id', 'total_rounds', 'round_duration', 'speed_mode',
          'challenge_type', 'invited_user_ids', 'invited_by', 'status', 'created_at', 'updated_at'
        ].filter(col => columnNames.includes(col))
        
        // Add view_count if it exists
        if (columnNames.includes('view_count')) {
          insertColumns.push('view_count')
        }
        
        const placeholders = insertColumns.map(() => '?').join(', ')
        const values = [
          debateId,
          topic.trim(),
          description?.trim() || null,
          category.toUpperCase(),
          userId,
          challengerPosition,
          opponentPosition,
          opponentId,
          totalRounds || 5,
          roundDuration,
          speedMode ? 1 : 0,
          challengeType,
          invitedUserIds ? JSON.stringify(invitedUserIds) : null,
          challengeType !== 'OPEN' ? userId : null,
          'WAITING',
          now,
          now,
        ]
        
        // Add view_count default if column exists
        if (columnNames.includes('view_count')) {
          values.push(0)
        }
        
        await prisma.$executeRawUnsafe(`
          INSERT INTO debates (${insertColumns.join(', ')})
          VALUES (${placeholders})
        `, ...values)
        
        // Fetch the created debate with relations
        debate = await prisma.debate.findUnique({
          where: { id: debateId },
          include: {
            challenger: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
                eloRating: true,
              }
            },
            opponent: opponentId ? {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
                eloRating: true,
              }
            } : undefined,
          },
        })
      } else {
        // Re-throw if it's a different error
        throw error
      }
    }

    // Create notifications for invited users
    if (invitedUserIds && invitedUserIds.length > 0 && debate) {
      const challenger = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true },
      })

      const notificationData = invitedUserIds.map((invitedUserId: string) => ({
        userId: invitedUserId,
        type: (challengeType === 'DIRECT' ? 'DEBATE_INVITATION' : 'DEBATE_INVITATION') as any, // DEBATE_GROUP_INVITATION not in enum
        title: challengeType === 'DIRECT' 
          ? 'Direct Challenge Received'
          : 'Group Challenge Invitation',
        message: challengeType === 'DIRECT'
          ? `${challenger?.username || 'Someone'} has challenged you to a debate: "${topic}"`
          : `${challenger?.username || 'Someone'} has invited you to a group challenge: "${topic}"`,
        debateId: debate.id,
      }))

      await prisma.notification.createMany({
        data: notificationData,
      })
    }

    if (!debate) {
      return NextResponse.json(
        { error: 'Failed to create debate' },
        { status: 500 }
      )
    }

    return NextResponse.json(debate, { status: 201 })
  } catch (error) {
    console.error('Failed to create debate:', error)
    return NextResponse.json(
      { error: 'Failed to create debate' },
      { status: 500 }
    )
  }
}

