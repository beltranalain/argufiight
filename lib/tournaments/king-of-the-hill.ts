/**
 * King of the Hill Tournament Logic
 * Free-for-all format where bottom 25% are eliminated each round
 */

import { prisma } from '@/lib/db/prisma'

export interface ParticipantScore {
  participantId: string
  userId: string
  username: string
  totalScore: number
  averageScore: number
  matchCount: number
  wins: number
  losses: number
}

/**
 * Calculate scores for all participants in a round
 * For King of the Hill, we need to evaluate all participants' performance
 */
export async function calculateParticipantScores(
  tournamentId: string,
  roundNumber: number
): Promise<ParticipantScore[]> {
  // Get all active participants
  const participants = await prisma.tournamentParticipant.findMany({
    where: {
      tournamentId,
      status: { in: ['ACTIVE', 'REGISTERED'] },
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  })

  // Get all matches for this round
  const round = await prisma.tournamentRound.findUnique({
    where: {
      tournamentId_roundNumber: {
        tournamentId,
        roundNumber,
      },
    },
    include: {
      matches: {
        include: {
          participant1: true,
          participant2: true,
          winner: true,
        },
        where: {
          status: 'COMPLETED',
        },
      },
    },
  })

  if (!round) {
    throw new Error(`Round ${roundNumber} not found for tournament ${tournamentId}`)
  }

  // Calculate scores for each participant
  const scores: Map<string, ParticipantScore> = new Map()

  // Initialize all participants
  for (const participant of participants) {
    scores.set(participant.id, {
      participantId: participant.id,
      userId: participant.userId,
      username: participant.user.username,
      totalScore: 0,
      averageScore: 0,
      matchCount: 0,
      wins: 0,
      losses: 0,
    })
  }

  // Process matches to calculate scores
  for (const match of round.matches) {
    const p1Score = scores.get(match.participant1Id)
    const p2Score = scores.get(match.participant2Id)

    if (!p1Score || !p2Score) continue

    // Increment match count
    p1Score.matchCount++
    p2Score.matchCount++

    // Add scores (if available from Championship format or calculate from verdict)
    if (match.participant1Score !== null) {
      p1Score.totalScore += match.participant1Score
    }
    if (match.participant2Score !== null) {
      p2Score.totalScore += match.participant2Score
    }

    // Track wins/losses
    if (match.winnerId === match.participant1Id) {
      p1Score.wins++
      p2Score.losses++
    } else if (match.winnerId === match.participant2Id) {
      p2Score.wins++
      p1Score.losses++
    }
  }

  // Calculate average scores
  for (const score of scores.values()) {
    if (score.matchCount > 0) {
      score.averageScore = score.totalScore / score.matchCount
    }
  }

  return Array.from(scores.values())
}

/**
 * Determine which participants to eliminate (bottom 25%)
 * Returns the IDs of participants to eliminate
 */
export async function getEliminatedParticipants(
  tournamentId: string,
  roundNumber: number
): Promise<string[]> {
  const scores = await calculateParticipantScores(tournamentId, roundNumber)

  if (scores.length === 0) {
    return []
  }

  // Sort by average score (ascending - lowest scores first)
  scores.sort((a, b) => {
    // Primary sort: average score
    if (a.averageScore !== b.averageScore) {
      return a.averageScore - b.averageScore
    }
    // Secondary sort: win rate
    const aWinRate = a.matchCount > 0 ? a.wins / a.matchCount : 0
    const bWinRate = b.matchCount > 0 ? b.wins / b.matchCount : 0
    if (aWinRate !== bWinRate) {
      return aWinRate - bWinRate
    }
    // Tertiary sort: total wins
    if (a.wins !== b.wins) {
      return a.wins - b.wins
    }
    // Final sort: match count (more matches = better)
    return a.matchCount - b.matchCount
  })

  // Calculate how many to eliminate (bottom 25%, rounded up)
  const totalParticipants = scores.length
  const eliminateCount = Math.max(1, Math.ceil(totalParticipants * 0.25))

  // Get bottom 25% participant IDs
  const eliminatedIds = scores.slice(0, eliminateCount).map((s) => s.participantId)

  console.log(`[King of the Hill] Eliminating ${eliminatedIds.length} out of ${totalParticipants} participants (bottom 25%)`)

  return eliminatedIds
}

/**
 * Generate matches for King of the Hill format
 * In King of the Hill, all participants debate simultaneously in a free-for-all
 * We create matches between all participants (round-robin style, but simplified)
 */
export async function generateKingOfTheHillMatches(
  tournamentId: string,
  roundNumber: number
): Promise<void> {
  // Get tournament
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      participants: {
        where: {
          status: { in: ['ACTIVE', 'REGISTERED'] },
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              eloRating: true,
            },
          },
        },
        orderBy: {
          seed: 'asc',
        },
      },
    },
  })

  if (!tournament) {
    throw new Error('Tournament not found')
  }

  const activeParticipants = tournament.participants

  if (activeParticipants.length < 2) {
    throw new Error('Not enough active participants for King of the Hill')
  }

  // Create or get tournament round
  let round = await prisma.tournamentRound.findUnique({
    where: {
      tournamentId_roundNumber: {
        tournamentId,
        roundNumber,
      },
    },
  })

  if (!round) {
    round = await prisma.tournamentRound.create({
      data: {
        tournamentId,
        roundNumber,
        status: 'UPCOMING',
        startDate: new Date(),
      },
    })
  }

  // For King of the Hill, create matches between all participants
  // Simplified: pair them up (1 vs 2, 3 vs 4, etc.)
  // If odd number, last participant gets a bye (no match, auto-advances)
  const matches: Array<{
    participant1Id: string
    participant2Id: string
  }> = []

  for (let i = 0; i < activeParticipants.length; i += 2) {
    if (i + 1 < activeParticipants.length) {
      // Pair two participants
      matches.push({
        participant1Id: activeParticipants[i].id,
        participant2Id: activeParticipants[i + 1].id,
      })
    }
    // If odd number of participants, last one gets a bye (no match needed)
  }

  // Create matches in database
  for (const match of matches) {
    await prisma.tournamentMatch.create({
      data: {
        tournamentId,
        roundId: round.id,
        participant1Id: match.participant1Id,
        participant2Id: match.participant2Id,
        status: 'SCHEDULED',
      },
    })
  }

  console.log(`[King of the Hill] Created ${matches.length} matches for round ${roundNumber}`)
}

