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
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 50
    const userId = getUserIdFromSession(session)

    // Check for tournaments that should auto-start (full but still REGISTRATION_OPEN)
    // This handles cases where tournaments were created before auto-start logic was added
    // or if auto-start failed during join
    try {
      const fullTournaments = await prisma.tournament.findMany({
        where: {
          status: 'REGISTRATION_OPEN',
        },
        include: {
          participants: true,
        },
      })

      for (const tournament of fullTournaments) {
        if (tournament.participants.length >= tournament.maxParticipants) {
          console.log(`[Tournaments API] Auto-starting full tournament "${tournament.name}" (${tournament.id})`)
          try {
            const { startTournament } = await import('@/lib/tournaments/match-generation')
            await startTournament(tournament.id)
            console.log(`[Tournaments API] Successfully auto-started tournament ${tournament.id}`)
          } catch (error: any) {
            console.error(`[Tournaments API] Failed to auto-start tournament ${tournament.id}:`, error)
            // Continue with other tournaments
          }
        }
      }
    } catch (error: any) {
      // Don't fail the entire request if auto-start check fails
      console.error('[Tournaments API] Error checking for auto-start tournaments:', error)
    }

    // Build where clause
    const where: any = {}
    if (status && status !== 'ALL') {
      where.status = status as any // Cast to enum type
    }

    // Get all tournaments first, then filter private ones
    // Use select to explicitly get only the fields we need, including format
    const allTournaments = await prisma.tournament.findMany({
      where: status && status !== 'ALL' ? { status: status as any } : {},
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        maxParticipants: true,
        currentRound: true,
        totalRounds: true,
        startDate: true,
        endDate: true,
        minElo: true,
        isPrivate: true,
        invitedUserIds: true,
        format: true, // Include format field
        creatorId: true,
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
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Get more to filter
    })

    // Filter private tournaments - only show if user is creator or invited
    const tournaments = allTournaments.filter((tournament) => {
      // Show all public tournaments
      if (!tournament.isPrivate) {
        return true
      }
      
      // If no userId, hide all private tournaments
      if (!userId) {
        return false
      }
      
      // Show private tournaments where user is creator
      if (tournament.creatorId === userId) {
        return true
      }
      
      // Show private tournaments where user is invited
      if (tournament.invitedUserIds) {
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
    }).slice(0, limit) // Limit after filtering

    console.log(`[API /tournaments] Found ${allTournaments.length} total tournaments, ${tournaments.length} after filtering (userId: ${userId || 'none'})`)
    if (allTournaments.length > 0) {
      console.log('[API /tournaments] Sample tournament:', {
        id: allTournaments[0].id,
        name: allTournaments[0].name,
        status: allTournaments[0].status,
        isPrivate: allTournaments[0].isPrivate,
        creatorId: allTournaments[0].creatorId,
        invitedUserIds: allTournaments[0].invitedUserIds,
      })
    }
    if (tournaments.length > 0) {
      console.log('[API /tournaments] Filtered tournaments:', tournaments.map(t => ({
        id: t.id,
        name: t.name,
        status: t.status,
        isPrivate: t.isPrivate,
      })))
    } else {
      console.log('[API /tournaments] No tournaments after filtering - checking why...')
      if (allTournaments.length > 0) {
        console.log('[API /tournaments] All tournaments were filtered out. Reasons:')
        allTournaments.forEach(t => {
          if (t.isPrivate) {
            console.log(`  - Tournament "${t.name}" (${t.id}) is private`)
            console.log(`    Creator: ${t.creatorId}, User: ${userId || 'none'}`)
            if (t.invitedUserIds) {
              try {
                const invitedIds = JSON.parse(t.invitedUserIds) as string[]
                console.log(`    Invited users: ${invitedIds.join(', ')}`)
                console.log(`    User is invited: ${userId && invitedIds.includes(userId)}`)
              } catch (e) {
                console.log(`    Failed to parse invitedUserIds: ${t.invitedUserIds}`)
              }
            }
          }
        })
      }
    }

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
      isPrivate: tournament.isPrivate,
      format: tournament.format || 'BRACKET', // Default to BRACKET for old tournaments
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
      format = 'BRACKET', // 'BRACKET' or 'CHAMPIONSHIP'
      selectedPosition = null, // 'PRO' or 'CON' (required for Championship format)
    } = body

    // Validate required fields
    if (!name || !startDate) {
      return NextResponse.json(
        { error: 'Name and start date are required' },
        { status: 400 }
      )
    }

    // Validate format
    if (format !== 'BRACKET' && format !== 'CHAMPIONSHIP') {
      return NextResponse.json(
        { error: 'Format must be BRACKET or CHAMPIONSHIP' },
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

    // For Championship format, require position selection
    if (format === 'CHAMPIONSHIP') {
      if (!selectedPosition || (selectedPosition !== 'PRO' && selectedPosition !== 'CON')) {
        return NextResponse.json(
          { error: 'Championship format requires selecting a position (PRO or CON)' },
          { status: 400 }
        )
      }
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

    // Get creator's ELO rating for automatic participant registration
    const creator = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        eloRating: true,
      },
    })

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      )
    }

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
        format: format as any, // 'BRACKET' or 'CHAMPIONSHIP'
        assignedJudges: null, // Will be set when tournament starts (Championship only)
        // Automatically add creator as first participant (seed 1)
        participants: {
          create: {
            userId: creator.id,
            seed: 1, // Creator is always seed #1
            eloAtStart: creator.eloRating,
            status: 'REGISTERED',
            selectedPosition: format === 'CHAMPIONSHIP' ? selectedPosition : null, // Store creator's position for Championship
          },
        },
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

    console.log(`Tournament "${tournament.name}" created with creator ${creator.username} (${creator.id}) as automatic participant (seed 1)`)

    // Don't record usage yet - only record when tournament starts (status changes from UPCOMING)
    // This allows users to delete UPCOMING tournaments without it counting against their limit

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

