import { prisma } from '@/lib/db/prisma'

/**
 * Create Round 1 debate for King of the Hill tournament
 * All participants submit simultaneously
 */
export async function createKingOfTheHillRound1(
  tournamentId: string
): Promise<string> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        where: {
          status: { in: ['REGISTERED', 'ACTIVE'] },
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

  if (tournament.format !== 'KING_OF_THE_HILL') {
    throw new Error('This function is only for King of the Hill tournaments')
  }

  const participants = tournament.participants
  if (participants.length < 2) {
    throw new Error('Not enough participants for King of the Hill tournament')
  }

  // Create or get Round 1
  let round = await prisma.tournamentRound.findUnique({
    where: {
      tournamentId_roundNumber: {
        tournamentId,
        roundNumber: 1,
      },
    },
  })

  if (!round) {
    round = await prisma.tournamentRound.create({
      data: {
        tournamentId,
        roundNumber: 1,
        status: 'UPCOMING',
        startDate: new Date(),
      },
    })
  }

  // Create debate with all participants (GROUP challenge)
  const debate = await prisma.debate.create({
    data: {
      topic: tournament.name,
      category: 'OTHER', // Default category for tournaments
      challengerId: participants[0].userId,
      challengerPosition: 'FOR',
      opponentId: participants.length > 1 ? participants[1].userId : participants[0].userId,
      opponentPosition: 'AGAINST',
      challengeType: 'GROUP',
      status: 'ACTIVE',
      currentRound: 1,
      totalRounds: 1, // King of the Hill rounds are single submission
      visibility: tournament.isPrivate ? 'PRIVATE' : 'PUBLIC',
    },
  })

  // Add all participants to the debate
  console.log(`[King of the Hill] Round 1: Adding ${participants.length} participants to debate ${debate.id}`)
  await Promise.all(
    participants.map((p, index) => {
      const userId = p.userId || p.user?.id
      if (!userId) {
        console.error(`[King of the Hill] Round 1: Missing userId for participant`, p)
        return Promise.resolve()
      }
      console.log(`[King of the Hill] Round 1: Adding participant ${userId} to debate ${debate.id}`)
      return prisma.debateParticipant.create({
        data: {
          debateId: debate.id,
          userId: userId,
          position: index % 2 === 0 ? 'FOR' : 'AGAINST', // Alternate positions
          status: 'ACTIVE',
        },
      })
    })
  )

  // Create tournament match (for King of the Hill, use first two participants as placeholder)
  const tournamentParticipants = await prisma.tournamentParticipant.findMany({
    where: {
      tournamentId,
      userId: { in: participants.map(p => p.userId) },
    },
  })

  await prisma.tournamentMatch.create({
    data: {
      tournamentId,
      roundId: round.id,
      debateId: debate.id,
      participant1Id: tournamentParticipants[0]?.id || '',
      participant2Id: tournamentParticipants[1]?.id || tournamentParticipants[0]?.id || '',
      status: 'IN_PROGRESS',
    },
  })

  // Update round status
  await prisma.tournamentRound.update({
    where: { id: round.id },
    data: {
      status: 'IN_PROGRESS',
    },
  })

  console.log(`[King of the Hill] Round 1 created: Debate ${debate.id} with ${participants.length} participants`)

  return debate.id
}

/**
 * Create Round 2+ debate for King of the Hill tournament
 * Only active (non-eliminated) participants
 */
export async function createKingOfTheHillRound(
  tournamentId: string,
  roundNumber: number
): Promise<string> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        where: {
          status: 'ACTIVE', // Only active participants (survivors from previous rounds)
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

  if (tournament.format !== 'KING_OF_THE_HILL') {
    throw new Error('This function is only for King of the Hill tournaments')
  }

  const participants = tournament.participants
  if (participants.length < 2) {
    throw new Error('Not enough active participants for King of the Hill round')
  }

  // Check if we should transition to finals (exactly 2 participants)
  if (participants.length === 2) {
    // Create finals (traditional 3-round head-to-head)
    return await createKingOfTheHillFinals(tournamentId, roundNumber, participants)
  }

  // Create or get round
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

  // Create debate with all active participants
  // Get userIds - TournamentParticipant has userId field directly
  const firstUserId = (participants[0] as any).userId || participants[0].user?.id
  const secondUserId = participants.length > 1 
    ? ((participants[1] as any).userId || participants[1].user?.id)
    : firstUserId
  
  if (!firstUserId) {
    throw new Error(`Missing userId for first participant in round ${roundNumber}`)
  }
  
  const debate = await prisma.debate.create({
    data: {
      topic: tournament.name,
      category: 'OTHER', // Default category for tournaments
      challengerId: firstUserId,
      challengerPosition: 'FOR',
      opponentId: secondUserId,
      opponentPosition: 'AGAINST',
      challengeType: 'GROUP',
      status: 'ACTIVE',
      currentRound: 1,
      totalRounds: 1,
      visibility: tournament.isPrivate ? 'PRIVATE' : 'PUBLIC',
    },
  })

  // Add all active participants to the debate (SAME format as Round 1)
  console.log(`[King of the Hill] Round ${roundNumber}: Adding ${participants.length} participants to debate ${debate.id}`)
  
  // Ensure we have valid userIds - TournamentParticipant has userId field directly
  const participantUserIds = participants.map(p => {
    // TournamentParticipant has userId field, but also check user relation as fallback
    const userId = (p as any).userId || p.user?.id
    if (!userId) {
      console.error(`[King of the Hill] Round ${roundNumber}: Missing userId for participant`, JSON.stringify(p, null, 2))
      throw new Error(`Missing userId for participant in round ${roundNumber}`)
    }
    return userId
  })
  
  console.log(`[King of the Hill] Round ${roundNumber}: Participant user IDs:`, participantUserIds)
  
  await Promise.all(
    participantUserIds.map((userId, index) => {
      console.log(`[King of the Hill] Round ${roundNumber}: Adding participant ${userId} to debate ${debate.id}`)
      return prisma.debateParticipant.create({
        data: {
          debateId: debate.id,
          userId: userId,
          position: index % 2 === 0 ? 'FOR' : 'AGAINST', // Alternate positions
          status: 'ACTIVE',
        },
      }).catch((error) => {
        // If participant already exists (shouldn't happen, but handle gracefully)
        if (error.code === 'P2002') {
          console.warn(`[King of the Hill] Round ${roundNumber}: Participant ${userId} already exists in debate ${debate.id}`)
          return prisma.debateParticipant.findUnique({
            where: {
              debateId_userId: {
                debateId: debate.id,
                userId: userId,
              },
            },
          }).then(existing => {
            // Update status to ACTIVE if it exists
            if (existing && existing.status !== 'ACTIVE') {
              return prisma.debateParticipant.update({
                where: { id: existing.id },
                data: { status: 'ACTIVE' },
              })
            }
            return existing
          })
        }
        throw error
      })
    })
  )

  // Create tournament match (for King of the Hill, use first two participants as placeholder)
  const tournamentParticipants = await prisma.tournamentParticipant.findMany({
    where: {
      tournamentId,
      userId: { in: participants.map(p => p.userId) },
    },
  })

  await prisma.tournamentMatch.create({
    data: {
      tournamentId,
      roundId: round.id,
      debateId: debate.id,
      participant1Id: tournamentParticipants[0]?.id || '',
      participant2Id: tournamentParticipants[1]?.id || tournamentParticipants[0]?.id || '',
      status: 'IN_PROGRESS',
    },
  })

  // Update round status
  await prisma.tournamentRound.update({
    where: { id: round.id },
    data: {
      status: 'IN_PROGRESS',
    },
  })

  console.log(`[King of the Hill] Round ${roundNumber} created: Debate ${debate.id} with ${participants.length} participants`)

  return debate.id
}

/**
 * Create finals debate (traditional 3-round head-to-head)
 */
async function createKingOfTheHillFinals(
  tournamentId: string,
  roundNumber: number,
  participants: Array<{ userId: string }>
): Promise<string> {
  if (participants.length !== 2) {
    throw new Error('Finals requires exactly 2 participants')
  }

  // Create or get round
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

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  })

  // Create traditional 3-round debate (same as regular debates)
  const debate = await prisma.debate.create({
    data: {
      topic: tournament?.name || 'Finals',
      category: 'OTHER', // Default category for tournaments
      challengerId: participants[0].userId,
      challengerPosition: 'FOR',
      opponentId: participants[1].userId,
      opponentPosition: 'AGAINST',
      challengeType: 'ONE_ON_ONE',
      status: 'ACTIVE',
      currentRound: 1,
      totalRounds: 3, // Finals is 3 rounds
      visibility: tournament?.isPrivate ? 'PRIVATE' : 'PUBLIC',
    },
  })

  // Get tournament participants
  const tournamentParticipants = await prisma.tournamentParticipant.findMany({
    where: {
      tournamentId,
      userId: { in: participants.map(p => p.userId) },
    },
  })

  // Create tournament match (finals)
  await prisma.tournamentMatch.create({
    data: {
      tournamentId,
      roundId: round.id,
      debateId: debate.id,
      participant1Id: tournamentParticipants[0]?.id || '',
      participant2Id: tournamentParticipants[1]?.id || tournamentParticipants[0]?.id || '',
      status: 'IN_PROGRESS',
    },
  })

  // Update round status
  await prisma.tournamentRound.update({
    where: { id: round.id },
    data: {
      status: 'IN_PROGRESS',
    },
  })

  console.log(`[King of the Hill] Finals created: Debate ${debate.id} (3-round head-to-head)`)

  return debate.id
}

