import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'

// GET /api/tournaments/[id] - Get tournament details
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
    const tournamentId = params.id

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            eloRating: true,
          },
        },
        judge: {
          select: {
            id: true,
            name: true,
            emoji: true,
            personality: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
                eloRating: true,
              },
            },
          },
          orderBy: {
            seed: 'asc',
          },
        },
        matches: {
          include: {
            debate: {
              select: {
                id: true,
                topic: true,
                status: true,
                winnerId: true,
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
            },
          },
          orderBy: [
            { round: 'asc' },
            { matchNumber: 'asc' },
          ],
        },
        rounds: {
          orderBy: {
            roundNumber: 'asc',
          },
        },
      },
    })

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    // Check if user is participant
    const isParticipant = userId
      ? tournament.participants.some((p) => p.userId === userId)
      : false

    // Check if user is creator
    const isCreator = userId === tournament.creatorId

    return NextResponse.json({
      tournament: {
        id: tournament.id,
        name: tournament.name,
        description: tournament.description,
        status: tournament.status,
        maxParticipants: tournament.maxParticipants,
        currentRound: tournament.currentRound,
        totalRounds: tournament.totalRounds,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        minElo: tournament.minElo,
        roundDuration: tournament.roundDuration,
        reseedAfterRound: tournament.reseedAfterRound,
        reseedMethod: tournament.reseedMethod,
        creator: tournament.creator,
        judge: tournament.judge,
        participants: tournament.participants.map((p) => ({
          id: p.id,
          userId: p.userId,
          seed: p.seed,
          status: p.status,
          user: p.user,
        })),
        matches: tournament.matches.map((m) => ({
          id: m.id,
          round: m.round,
          matchNumber: m.matchNumber,
          participant1Id: m.participant1Id,
          participant2Id: m.participant2Id,
          winnerId: m.winnerId,
          status: m.status,
          debate: m.debate,
        })),
        rounds: tournament.rounds,
        isParticipant,
        isCreator,
        createdAt: tournament.createdAt,
      },
    })
  } catch (error: any) {
    console.error('Failed to fetch tournament:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tournament' },
      { status: 500 }
    )
  }
}

