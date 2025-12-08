import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'
import { canUseFeature, recordFeatureUsage } from '@/lib/subscriptions/subscription-utils'
import { FEATURES } from '@/lib/subscriptions/features'

// GET /api/tournaments - Get all tournaments (user-facing)
export async function GET(request: NextRequest) {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if tournaments feature is enabled
    const setting = await prisma.adminSetting.findUnique({
      where: { key: 'TOURNAMENTS_ENABLED' },
    })

    if (!setting || setting.value !== 'true') {
      return NextResponse.json({ error: 'Tournaments feature is disabled' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userId = getUserIdFromSession(session)

    // Build where clause
    const where: any = {}
    if (status && status !== 'ALL') {
      where.status = status
    }

    // Get all tournaments first, then filter private ones
    const allTournaments = await prisma.tournament.findMany({
      where: status && status !== 'ALL' ? { status } : {},
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        participants: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            participants: true,
            matches: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Get more to filter
    })

    // Filter private tournaments - only show if user is creator or invited
    const tournaments = allTournaments.filter((tournament) => {
      if (!tournament.isPrivate) {
        return true // Show all public tournaments
      }
      
      // Show private tournaments where user is creator
      if (tournament.creatorId === userId) {
        return true
      }
      
      // Show private tournaments where user is invited
      if (userId && tournament.invitedUserIds) {
        try {
          const invitedIds = JSON.parse(tournament.invitedUserIds) as string[]
          if (Array.isArray(invitedIds) && invitedIds.includes(userId)) {
            return true
          }
        } catch (error) {
          console.error('Failed to parse invitedUserIds:', tournament.invitedUserIds, error)
        }
      }
      
      return false // Hide private tournaments user doesn't have access to
    }).slice(0, 50) // Limit to 50 after filtering

    // Format response
    const formatted = tournaments.map((tournament) => ({
      id: tournament.id,
      name: tournament.name,
      description: tournament.description,
      status: tournament.status,
      maxParticipants: tournament.maxParticipants,
      currentRound: tournament.currentRound,
      totalRounds: tournament.totalRounds,
      participantCount: tournament._count.participants,
      matchCount: tournament._count.matches,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      minElo: tournament.minElo,
      creator: tournament.creator,
      isParticipant: userId ? tournament.participants.some((p) => p.userId === userId) : false,
      createdAt: tournament.createdAt,
    }))

    return NextResponse.json({ tournaments: formatted })
  } catch (error: any) {
    console.error('Failed to fetch tournaments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tournaments' },
      { status: 500 }
    )
  }
}

// POST /api/tournaments - Create a new tournament
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

    // Check if tournaments feature is enabled
    const setting = await prisma.adminSetting.findUnique({
      where: { key: 'TOURNAMENTS_ENABLED' },
    })

    if (!setting || setting.value !== 'true') {
      return NextResponse.json({ error: 'Tournaments feature is disabled' }, { status: 403 })
    }

    // Check if user can create tournaments (limit check)
    const canCreate = await canUseFeature(userId, FEATURES.TOURNAMENTS)
    
    if (!canCreate.allowed) {
      // Redirect to upgrade page
      return NextResponse.json(
        { 
          error: canCreate.reason || 'Tournament limit reached',
          redirectTo: '/upgrade',
          currentUsage: canCreate.currentUsage,
          limit: canCreate.limit,
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      description,
      maxParticipants = 16,
      startDate,
      minElo,
      judgeId,
      roundDuration = 24, // hours
      reseedAfterRound = true,
      reseedMethod = 'ELO_BASED',
      isPrivate = false,
      invitedUserIds = null,
    } = body

    // Validate required fields
    if (!name || !startDate) {
      return NextResponse.json(
        { error: 'Name and start date are required' },
        { status: 400 }
      )
    }

    // Validate maxParticipants (must be power of 2: 4, 8, 16, 32, 64)
    const validSizes = [4, 8, 16, 32, 64]
    if (!validSizes.includes(maxParticipants)) {
      return NextResponse.json(
        { error: 'Max participants must be 4, 8, 16, 32, or 64' },
        { status: 400 }
      )
    }

    // Validate private tournament has invited users
    if (isPrivate && (!invitedUserIds || !Array.isArray(invitedUserIds) || invitedUserIds.length === 0)) {
      return NextResponse.json(
        { error: 'Private tournaments must have at least one invited user' },
        { status: 400 }
      )
    }

    // Calculate total rounds (log2 of maxParticipants)
    const totalRounds = Math.log2(maxParticipants)

    // Create tournament
    const tournament = await prisma.tournament.create({
      data: {
        name,
        description: description || null,
        creatorId: userId,
        maxParticipants,
        totalRounds,
        currentRound: 1,
        status: 'UPCOMING',
        startDate: new Date(startDate),
        minElo: minElo ? parseInt(String(minElo)) : null,
        judgeId: judgeId || null,
        roundDuration,
        reseedAfterRound,
        reseedMethod: reseedMethod as any,
        isPrivate: isPrivate || false,
        invitedUserIds: isPrivate && invitedUserIds && Array.isArray(invitedUserIds)
          ? JSON.stringify(invitedUserIds)
          : null,
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    })

    // Record usage
    await recordFeatureUsage(userId, FEATURES.TOURNAMENTS)

    return NextResponse.json({ 
      success: true,
      tournament: {
        id: tournament.id,
        name: tournament.name,
        description: tournament.description,
        status: tournament.status,
        maxParticipants: tournament.maxParticipants,
        currentRound: tournament.currentRound,
        totalRounds: tournament.totalRounds,
        startDate: tournament.startDate,
        creator: tournament.creator,
        createdAt: tournament.createdAt,
      },
    })
  } catch (error: any) {
    console.error('Failed to create tournament:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create tournament' },
      { status: 500 }
    )
  }
}

