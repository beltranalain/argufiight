import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'

// POST /api/tournaments/[id]/join - Join a tournament
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: tournamentId } = await params

    // Get tournament
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        participants: true,
      },
    })

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    // Check if tournament is accepting registrations
    if (tournament.status !== 'UPCOMING' && tournament.status !== 'REGISTRATION_OPEN') {
      return NextResponse.json(
        { error: 'Tournament is not accepting registrations' },
        { status: 400 }
      )
    }

    // Check if already registered
    const alreadyRegistered = tournament.participants.some((p) => p.userId === userId)
    if (alreadyRegistered) {
      return NextResponse.json(
        { error: 'You are already registered for this tournament' },
        { status: 400 }
      )
    }

    // Check if tournament is full
    if (tournament.participants.length >= tournament.maxParticipants) {
      return NextResponse.json(
        { error: 'Tournament is full' },
        { status: 400 }
      )
    }

    // Check ELO requirement
    if (tournament.minElo) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { eloRating: true },
      })

      if (!user || user.eloRating < tournament.minElo) {
        return NextResponse.json(
          { error: `This tournament requires a minimum ELO of ${tournament.minElo}. Your ELO: ${user?.eloRating || 0}` },
          { status: 400 }
        )
      }
    }

    // Get current participant count for seeding
    const participantCount = tournament.participants.length

    // Add participant
    await prisma.tournamentParticipant.create({
      data: {
        tournamentId,
        userId,
        seed: participantCount + 1, // Temporary seed, will be reseeded when tournament starts
        status: 'REGISTERED',
      },
    })

    // Update tournament status if needed
    if (tournament.status === 'UPCOMING') {
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: { status: 'REGISTRATION_OPEN' },
      })
    }

    // Check if tournament is now full and should auto-start
    const updatedTournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        participants: true,
      },
    })

    if (updatedTournament && updatedTournament.participants.length >= updatedTournament.maxParticipants) {
      // Tournament is full - could auto-start here if desired
      // For now, creator will need to manually start it
    }

    return NextResponse.json({ success: true, message: 'Successfully joined tournament' })
  } catch (error: any) {
    console.error('Failed to join tournament:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to join tournament' },
      { status: 500 }
    )
  }
}

