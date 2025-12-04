import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'

// GET /api/admin/tournaments - Get all tournaments
export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAdmin()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, return empty array until tournament schema is added
    // This prevents errors while the feature is being developed
    const tournaments = await prisma.$queryRaw`
      SELECT 
        id,
        name,
        description,
        status,
        "maxParticipants" as "max_participants",
        "currentRound" as "current_round",
        "totalRounds" as "total_rounds",
        "createdAt" as "created_at",
        "creatorId" as "creator_id"
      FROM tournaments
      ORDER BY "createdAt" DESC
      LIMIT 100
    `.catch(() => [])

    // If tournaments table doesn't exist yet, return empty array
    if (!Array.isArray(tournaments)) {
      return NextResponse.json([])
    }

    // Fetch creator info for each tournament
    const tournamentsWithCreators = await Promise.all(
      (tournaments as any[]).map(async (tournament: any) => {
        const creator = await prisma.user.findUnique({
          where: { id: tournament.creator_id },
          select: { username: true, email: true },
        })

        // Count participants
        const participantCount = await prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*) as count
          FROM tournament_participants
          WHERE "tournamentId" = ${tournament.id}
        `.catch(() => [{ count: BigInt(0) }])

        return {
          id: tournament.id,
          name: tournament.name,
          description: tournament.description,
          status: tournament.status,
          maxParticipants: tournament.max_participants || 16,
          currentRound: tournament.current_round || 1,
          totalRounds: tournament.total_rounds || 4,
          participantCount: Number(participantCount[0]?.count || 0),
          createdAt: tournament.created_at,
          creator: creator || { username: 'Unknown', email: '' },
        }
      })
    )

    return NextResponse.json(tournamentsWithCreators)
  } catch (error: any) {
    // If table doesn't exist, return empty array
    if (error.message?.includes('does not exist') || error.code === '42P01') {
      return NextResponse.json([])
    }

    console.error('Failed to fetch tournaments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tournaments' },
      { status: 500 }
    )
  }
}

