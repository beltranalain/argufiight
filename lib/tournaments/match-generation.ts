/**
 * Tournament Match Generation Logic
 * Generates matches for a tournament round based on bracket seeding
 */

import { prisma } from '@/lib/db/prisma'

export interface TournamentParticipantData {
  id: string
  userId: string
  seed: number | null
  eloAtStart: number
  user: {
    id: string
    username: string
    eloRating: number
  }
}

/**
 * Generate matches for a tournament round
 * Uses standard bracket seeding: 1 vs 16, 2 vs 15, etc.
 */
export async function generateTournamentMatches(
  tournamentId: string,
  roundNumber: number
): Promise<void> {
  // Get tournament
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      participants: {
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
          seed: 'asc', // Order by seed (1, 2, 3, ...)
        },
      },
    },
  })

  if (!tournament) {
    throw new Error('Tournament not found')
  }

  // Filter active participants (not eliminated)
  const activeParticipants = tournament.participants.filter(
    (p) => p.status === 'REGISTERED' || p.status === 'ACTIVE'
  )

  if (activeParticipants.length < 2) {
    throw new Error('Not enough active participants to generate matches')
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

  // Generate bracket matches
  // For round 1: Seed 1 vs Seed N, Seed 2 vs Seed N-1, etc.
  // For subsequent rounds: Winners face each other based on bracket position
  const matches: Array<{
    participant1Id: string
    participant2Id: string
  }> = []

  if (roundNumber === 1) {
    // First round: Standard bracket seeding
    const numMatches = activeParticipants.length / 2
    for (let i = 0; i < numMatches; i++) {
      const participant1 = activeParticipants[i]
      const participant2 = activeParticipants[activeParticipants.length - 1 - i]
      matches.push({
        participant1Id: participant1.id,
        participant2Id: participant2.id,
      })
    }
  } else {
    // Subsequent rounds: Get winners from previous round
    const previousRound = await prisma.tournamentRound.findUnique({
      where: {
        tournamentId_roundNumber: {
          tournamentId,
          roundNumber: roundNumber - 1,
        },
      },
      include: {
        matches: {
          include: {
            winner: true,
          },
          where: {
            status: 'COMPLETED',
          },
        },
      },
    })

    if (!previousRound) {
      throw new Error(`Previous round ${roundNumber - 1} not found`)
    }

    const winners = previousRound.matches
      .map((m) => m.winner)
      .filter((w): w is NonNullable<typeof w> => w !== null)
      .sort((a, b) => {
        // Sort by original match order to maintain bracket structure
        const matchA = previousRound.matches.find((m) => m.winnerId === a.id)
        const matchB = previousRound.matches.find((m) => m.winnerId === b.id)
        return (matchA?.id || '').localeCompare(matchB?.id || '')
      })

    if (winners.length < 2) {
      throw new Error('Not enough winners from previous round')
    }

    // Pair winners: 1st vs 2nd, 3rd vs 4th, etc.
    const numMatches = Math.floor(winners.length / 2)
    for (let i = 0; i < numMatches; i++) {
      const winner1 = winners[i * 2]
      const winner2 = winners[i * 2 + 1]
      
      // Find participant records by matching the winner's participant ID
      const p1 = activeParticipants.find((p) => p.id === winner1.id)
      const p2 = activeParticipants.find((p) => p.id === winner2.id)
      
      if (p1 && p2) {
        matches.push({
          participant1Id: p1.id,
          participant2Id: p2.id,
        })
      }
    }
  }

  // Create match records
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

  console.log(`Generated ${matches.length} matches for tournament ${tournamentId}, round ${roundNumber}`)
}

/**
 * Start a tournament: Generate first round matches and create debates
 */
export async function startTournament(tournamentId: string): Promise<void> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              eloRating: true,
            },
          },
        },
      },
      judge: true,
    },
  })

  if (!tournament) {
    throw new Error('Tournament not found')
  }

  if (tournament.status === 'IN_PROGRESS' || tournament.status === 'COMPLETED') {
    throw new Error('Tournament has already started or completed')
  }

  if (tournament.participants.length < 2) {
    throw new Error('Tournament needs at least 2 participants to start')
  }

  // Update tournament status
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: {
      status: 'IN_PROGRESS',
      currentRound: 1,
    },
  })

  // Generate first round matches
  await generateTournamentMatches(tournamentId, 1)

  // Create debates for each match
  const round = await prisma.tournamentRound.findUnique({
    where: {
      tournamentId_roundNumber: {
        tournamentId,
        roundNumber: 1,
      },
    },
    include: {
      matches: {
        include: {
          participant1: {
            include: {
              user: true,
            },
          },
          participant2: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  })

  if (!round) {
    throw new Error('Failed to create tournament round')
  }

  // Create debates for each match
  for (const match of round.matches) {
    const participant1 = match.participant1.user
    const participant2 = match.participant2.user

    // Create debate topic based on tournament name
    const debateTopic = `${tournament.name} - Round ${round.roundNumber}, Match ${match.id.slice(0, 8)}`

    // Create debate
    // Note: Judge is assigned when creating verdicts, not when creating the debate
    const debate = await prisma.debate.create({
      data: {
        topic: debateTopic,
        description: `Tournament match: ${participant1.username} vs ${participant2.username}`,
        category: 'SPORTS', // Default category, could be configurable
        challengerId: participant1.id,
        challengerPosition: 'FOR',
        opponentPosition: 'AGAINST',
        opponentId: participant2.id,
        totalRounds: 3, // Tournament matches are 3 rounds
        roundDuration: tournament.roundDuration * 3600000, // Convert hours to milliseconds
        speedMode: false,
        allowCopyPaste: true,
        status: 'ACTIVE',
        // judgeId is not part of Debate model - judges are assigned in Verdict model
      },
    })

    // Link debate to match
    await prisma.tournamentMatch.update({
      where: { id: match.id },
      data: {
        debateId: debate.id,
        status: 'IN_PROGRESS',
      },
    })

    console.log(`Created debate ${debate.id} for match ${match.id}`)
  }

  console.log(`Tournament ${tournamentId} started with ${round.matches.length} matches`)
}

