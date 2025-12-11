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

  // Don't create rounds for completed tournaments
  if (tournament.status === 'COMPLETED') {
    console.log(`[King of the Hill] Tournament ${tournamentId} is already COMPLETED - skipping round creation`)
    throw new Error('Tournament is already completed')
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
    // Map participants to the format expected by createKingOfTheHillFinals
    const finalsParticipants = participants.map(p => ({
      userId: (p as any).userId || p.user?.id,
    }))
    return await createKingOfTheHillFinals(tournamentId, roundNumber, finalsParticipants)
  }

  // Create or get round
  let round = await prisma.tournamentRound.findUnique({
    where: {
      tournamentId_roundNumber: {
        tournamentId,
        roundNumber,
      },
    },
    include: {
      matches: {
        include: {
          debate: true,
        },
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
      include: {
        matches: {
          include: {
            debate: true,
          },
        },
      },
    })
  }

  // Check if debate already exists for this round (prevent duplicates)
  const existingMatch = round.matches.find(m => m.debate && m.debate.challengeType === 'GROUP')
  if (existingMatch && existingMatch.debate) {
    console.log(`[King of the Hill] Round ${roundNumber} debate already exists: Debate ${existingMatch.debate.id}`)
    return existingMatch.debate.id
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
  
  // Create all DebateParticipant records - ensure all are created successfully
  const participantCreationResults = await Promise.allSettled(
    participantUserIds.map((userId, index) => {
      console.log(`[King of the Hill] Round ${roundNumber}: Adding participant ${userId} to debate ${debate.id}`)
      return prisma.debateParticipant.create({
        data: {
          debateId: debate.id,
          userId: userId,
          position: index % 2 === 0 ? 'FOR' : 'AGAINST', // Alternate positions
          status: 'ACTIVE',
        },
      }).catch(async (error) => {
        // If participant already exists, update it to ACTIVE
        if (error.code === 'P2002') {
          console.warn(`[King of the Hill] Round ${roundNumber}: Participant ${userId} already exists in debate ${debate.id}, updating to ACTIVE`)
          const existing = await prisma.debateParticipant.findUnique({
            where: {
              debateId_userId: {
                debateId: debate.id,
                userId: userId,
              },
            },
          })
          if (existing) {
            if (existing.status !== 'ACTIVE') {
              return await prisma.debateParticipant.update({
                where: { id: existing.id },
                data: { status: 'ACTIVE' },
              })
            }
            return existing
          }
        }
        console.error(`[King of the Hill] Round ${roundNumber}: Error creating participant ${userId}:`, error)
        throw error
      })
    })
  )
  
  // Check for any failures
  const failures = participantCreationResults.filter(result => result.status === 'rejected')
  if (failures.length > 0) {
    console.error(`[King of the Hill] Round ${roundNumber}: Failed to create ${failures.length} participant(s):`, failures)
    throw new Error(`Failed to create ${failures.length} participant(s) for round ${roundNumber}`)
  }
  
  // Verify all participants were created
  const createdParticipants = await prisma.debateParticipant.findMany({
    where: {
      debateId: debate.id,
      status: 'ACTIVE',
    },
  })
  
  console.log(`[King of the Hill] Round ${roundNumber}: Successfully created ${createdParticipants.length} DebateParticipant records`)
  
  if (createdParticipants.length !== participantUserIds.length) {
    console.error(`[King of the Hill] Round ${roundNumber}: Mismatch! Expected ${participantUserIds.length} participants, found ${createdParticipants.length}`)
    throw new Error(`Expected ${participantUserIds.length} participants, but only ${createdParticipants.length} were created`)
  }

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

  // Check if tournament is already completed and get tournament data
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  })

  if (!tournament) {
    throw new Error('Tournament not found')
  }

  if (tournament.status === 'COMPLETED') {
    console.log(`[King of the Hill] Tournament ${tournamentId} is already COMPLETED - skipping finals creation`)
    throw new Error('Tournament is already completed')
  }

  // Create or get round
  let round = await prisma.tournamentRound.findUnique({
    where: {
      tournamentId_roundNumber: {
        tournamentId,
        roundNumber,
      },
    },
    include: {
      matches: {
        include: {
          debate: true,
        },
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
      include: {
        matches: {
          include: {
            debate: true,
          },
        },
      },
    })
  }

  // Check if finals debate already exists for this round (prevent duplicates)
  const existingMatch = round.matches.find(m => m.debate && m.debate.challengeType === 'ONE_ON_ONE')
  if (existingMatch && existingMatch.debate) {
    console.log(`[King of the Hill] Finals already exists for round ${roundNumber}: Debate ${existingMatch.debate.id}`)
    return existingMatch.debate.id
  }

  // Create traditional 3-round debate (same as regular debates)
  // Finals uses classic debate rules: ONE_ON_ONE, 3 rounds, alternating turns
  const roundDuration = tournament?.roundDuration ? tournament.roundDuration * 60 * 60 * 1000 : 24 * 60 * 60 * 1000 // Default 24 hours
  const now = new Date()
  const debate = await prisma.debate.create({
    data: {
      topic: tournament?.name || 'Finals',
      category: 'OTHER', // Default category for tournaments
      challengerId: participants[0].userId,
      challengerPosition: 'FOR',
      opponentId: participants[1].userId,
      opponentPosition: 'AGAINST',
      challengeType: 'ONE_ON_ONE', // Classic head-to-head format
      status: 'ACTIVE',
      currentRound: 1,
      totalRounds: 3, // Finals is 3 rounds (classic debate format)
      roundDuration: roundDuration,
      roundDeadline: new Date(now.getTime() + roundDuration), // Set deadline for first round
      startedAt: now, // Mark debate as started
      visibility: tournament?.isPrivate ? 'PRIVATE' : 'PUBLIC',
    },
  })
  
  console.log(`[King of the Hill] Finals debate created:`, {
    debateId: debate.id,
    challengerId: participants[0].userId,
    opponentId: participants[1].userId,
    challengeType: 'ONE_ON_ONE',
    totalRounds: 3,
    status: 'ACTIVE',
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

