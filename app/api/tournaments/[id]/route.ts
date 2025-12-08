import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'

// GET /api/tournaments/[id] - Get tournament details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: tournamentId } = await params
    const userId = getUserIdFromSession(session)

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
            round: {
              select: {
                roundNumber: true,
              },
            },
            debate: {
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
            },
          },
          orderBy: {
            round: {
              roundNumber: 'asc',
            },
          },
        },
      },
    })

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    // Access control for private tournaments
    if (tournament.isPrivate) {
      if (tournament.creatorId !== userId) {
        let isInvited = false
        if (userId && tournament.invitedUserIds) {
          try {
            const invitedIds = JSON.parse(tournament.invitedUserIds) as string[]
            isInvited = Array.isArray(invitedIds) && invitedIds.includes(userId)
          } catch (error) {
            console.error('Failed to parse invitedUserIds for private tournament access:', tournament.invitedUserIds, error)
          }
        }
        if (!isInvited) {
          return NextResponse.json({ error: 'Unauthorized: This is a private tournament' }, { status: 403 })
        }
      }
    }

    // Calculate match numbers
    const matchesWithNumbers = tournament.matches.map((match, index) => ({
      ...match,
      matchNumber: index + 1,
    }))

    return NextResponse.json({
      ...tournament,
      matches: matchesWithNumbers,
      isParticipant: userId ? tournament.participants.some((p) => p.userId === userId) : false,
      isCreator: tournament.creatorId === userId,
    })
  } catch (error: any) {
    console.error('Failed to fetch tournament:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tournament' },
      { status: 500 }
    )
  }
}

// DELETE /api/tournaments/[id] - Delete a tournament
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: tournamentId } = await params
    const userId = getUserIdFromSession(session)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get tournament to verify ownership and status
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        participants: true,
        matches: {
          include: {
            debate: true,
          },
        },
      },
    })

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    // Only creator can delete
    if (tournament.creatorId !== userId) {
      return NextResponse.json({ error: 'Only the tournament creator can delete it' }, { status: 403 })
    }

    // Only allow deletion if tournament hasn't started or has no participants
    // Allow deletion of UPCOMING tournaments even with participants (before it starts)
    if (tournament.status === 'IN_PROGRESS' || tournament.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot delete a tournament that has started or completed' },
        { status: 400 }
      )
    }

    // Delete tournament (cascade will handle related records)
    await prisma.tournament.delete({
      where: { id: tournamentId },
    })

    return NextResponse.json({ success: true, message: 'Tournament deleted successfully' })
  } catch (error: any) {
    console.error('Failed to delete tournament:', error)
    return NextResponse.json(
      { error: 'Failed to delete tournament' },
      { status: 500 }
    )
  }
}
