/**
 * King of the Hill Tournament Logic
 * Free-for-all format where all participants debate the same topic simultaneously
 * Bottom 25% are eliminated each round until finals (2 participants)
 * Finals is a traditional 3-round head-to-head debate
 */

import { prisma } from '@/lib/db/prisma'

export interface ParticipantScore {
  participantId: string
  userId: string
  username: string
  score: number // Score for this round
  cumulativeScore: number // Total score across all rounds
  rank: number // Rank in this round (1 = best, N = worst)
}

export interface EliminationResult {
  eliminatedParticipantIds: string[]
  eliminationExplanations: Record<string, string> // participantId -> explanation
  remainingParticipantIds: string[]
  scores: ParticipantScore[]
}

/**
 * Generate a single Debate for a King of the Hill round
 * All active participants debate the same topic simultaneously
 */
export async function createKingOfTheHillDebate(
  tournamentId: string,
  roundNumber: number
): Promise<string> {
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

  // Get or create tournament round
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
        status: 'IN_PROGRESS',
        startDate: new Date(),
      },
    })
  }

  // Create a single Debate with all participants
  // The topic is the tournament name (same topic for all rounds)
  const participantNames = activeParticipants.map(p => p.user.username).join(', ')
  const debate = await prisma.debate.create({
    data: {
      topic: tournament.name,
      description: `King of the Hill Round ${roundNumber} - Open Debate with ${activeParticipants.length} participants: ${participantNames}`,
      category: 'OTHER', // Default category for tournaments
      challengerId: activeParticipants[0].userId, // First participant as challenger
      challengerPosition: 'FOR', // Default position
      opponentPosition: 'AGAINST', // Default position
      totalRounds: 1, // Each round is a single submission round
      currentRound: 1,
      roundDuration: tournament.roundDuration * 60 * 60 * 1000, // Convert hours to milliseconds
      status: 'ACTIVE',
      challengeType: 'GROUP', // Multi-participant debate
      roundDeadline: new Date(Date.now() + tournament.roundDuration * 60 * 60 * 1000),
      // Create DebateParticipant records for all participants
      participants: {
        create: activeParticipants.map((participant, index) => ({
          userId: participant.userId,
          position: index % 2 === 0 ? 'FOR' : 'AGAINST', // Alternate positions
          status: 'ACTIVE',
          joinedAt: new Date(),
        })),
      },
    },
    include: {
      participants: true,
    },
  })

  // Create a TournamentMatch record linking the debate to the round
  // For King of the Hill, we use a special match structure
  await prisma.tournamentMatch.create({
    data: {
      tournamentId,
      roundId: round.id,
      participant1Id: activeParticipants[0].id,
      participant2Id: activeParticipants[activeParticipants.length > 1 ? 1 : 0].id, // Use second participant or duplicate first
      debateId: debate.id,
      status: 'IN_PROGRESS',
    },
  })

  console.log(`[King of the Hill] Created debate ${debate.id} for round ${roundNumber} with ${activeParticipants.length} participants:`, 
    activeParticipants.map(p => p.user.username).join(', '))

  return debate.id
}

/**
 * Evaluate all submissions in a King of the Hill round
 * AI judges all participants together and ranks them
 */
export async function evaluateKingOfTheHillRound(
  debateId: string,
  tournamentId: string,
  roundNumber: number
): Promise<EliminationResult> {
  // Get the debate with all statements
  const debate = await prisma.debate.findUnique({
    where: { id: debateId },
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
      },
      statements: {
        include: {
          author: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  })

  if (!debate) {
    throw new Error('Debate not found')
  }

  // Get tournament participants with cumulative scores
  const tournamentParticipants = await prisma.tournamentParticipant.findMany({
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

  // Build context for AI evaluation
  const submissions = debate.statements.map((statement) => ({
    userId: statement.authorId,
    username: statement.author.username,
    content: statement.content,
    round: statement.round,
  }))

  // Get a judge for the verdict (use first available judge)
  const judges = await prisma.judge.findMany()
  if (judges.length === 0) {
    throw new Error('No judges available for King of the Hill evaluation')
  }
  const judge = judges[0]

  // Call AI to evaluate all submissions together
  const { generateKingOfTheHillVerdict } = await import('./king-of-the-hill-ai')
  const verdict = await generateKingOfTheHillVerdict(
    debate.topic,
    submissions,
    roundNumber
  )

  // Map AI verdict to participant scores
  const participantScores: ParticipantScore[] = tournamentParticipants.map((tp) => {
    const verdictEntry = verdict.rankings.find((r) => r.userId === tp.userId)
    const roundScore = verdictEntry?.score || 0
    const cumulativeScore = (tp.cumulativeScore || 0) + roundScore

    return {
      participantId: tp.id,
      userId: tp.userId,
      username: tp.user.username,
      score: roundScore,
      cumulativeScore,
      rank: verdictEntry?.rank || tournamentParticipants.length,
    }
  })

  // Sort by score (descending - highest first)
  participantScores.sort((a, b) => b.score - a.score)

  // Calculate how many to eliminate (bottom 25%, minimum 1)
  const totalParticipants = participantScores.length
  const eliminateCount = Math.max(1, Math.ceil(totalParticipants * 0.25))

  // Get bottom 25% (lowest scores)
  const eliminated = participantScores.slice(-eliminateCount)
  const remaining = participantScores.slice(0, -eliminateCount)

  // Build elimination explanations
  const eliminationExplanations: Record<string, string> = {}
  for (const eliminatedParticipant of eliminated) {
    const explanation = verdict.eliminationExplanations[eliminatedParticipant.userId] || 
      `Ranked ${eliminatedParticipant.rank} out of ${totalParticipants} with a score of ${eliminatedParticipant.score}`
    eliminationExplanations[eliminatedParticipant.participantId] = explanation
  }

  // Build ranking summary for verdict reasoning
  const rankingSummary = participantScores
    .map((ps, index) => `${index + 1}. ${ps.username} - Score: ${ps.score}/100 (Rank: ${ps.rank})`)
    .join('\n')
  
  const eliminationSummary = eliminated
    .map((e) => `• ${e.username} (Score: ${e.score}/100) - ${eliminationExplanations[e.participantId]}`)
    .join('\n')

  const verdictReasoning = `King of the Hill Round ${roundNumber} - Overall Rankings:\n\n${rankingSummary}\n\nEliminated Participants (Bottom 25%):\n${eliminationSummary}`

  // Get top 2 participants for challenger/opponent scores
  const topParticipant = participantScores[0]
  const secondParticipant = participantScores[1] || participantScores[0]

  // Determine winner (top participant)
  const winnerId = topParticipant?.userId || null
  const decision = winnerId ? 'CHALLENGER_WINS' : 'TIE'

  // Create verdict record for display on debate page
  await prisma.verdict.create({
    data: {
      debateId,
      judgeId: judge.id,
      winnerId,
      decision: decision as 'CHALLENGER_WINS' | 'OPPONENT_WINS' | 'TIE',
      reasoning: verdictReasoning,
      challengerScore: topParticipant?.score || null,
      opponentScore: secondParticipant?.score || null,
    },
  })

  // Update judge stats
  await prisma.judge.update({
    where: { id: judge.id },
    data: {
      debatesJudged: {
        increment: 1,
      },
    },
  })

  // Update participant cumulative scores and mark eliminated ones
  for (const score of participantScores) {
    await prisma.tournamentParticipant.update({
      where: { id: score.participantId },
      data: {
        cumulativeScore: score.cumulativeScore,
      },
    })
  }

  for (const eliminatedParticipant of eliminated) {
    await prisma.tournamentParticipant.update({
      where: { id: eliminatedParticipant.participantId },
      data: {
        status: 'ELIMINATED',
        eliminatedAt: new Date(),
        eliminationRound: roundNumber,
        eliminationReason: eliminationExplanations[eliminatedParticipant.participantId],
      },
    })
  }

  return {
    eliminatedParticipantIds: eliminated.map((e) => e.participantId),
    eliminationExplanations,
    remainingParticipantIds: remaining.map((r) => r.participantId),
    scores: participantScores,
  }
}

/**
 * Check if tournament should transition to finals
 * Finals = exactly 2 active participants remaining
 */
export async function shouldTransitionToFinals(tournamentId: string): Promise<boolean> {
  const activeCount = await prisma.tournamentParticipant.count({
    where: {
      tournamentId,
      status: { in: ['ACTIVE', 'REGISTERED'] },
    },
  })

  return activeCount === 2
}

/**
 * Create finals debate (traditional 3-round head-to-head)
 */
export async function createFinalsDebate(
  tournamentId: string,
  roundNumber: number
): Promise<string> {
  // Get the 2 remaining participants
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
    orderBy: {
      seed: 'asc',
    },
  })

  if (participants.length !== 2) {
    throw new Error(`Finals requires exactly 2 participants, found ${participants.length}`)
  }

  // Get tournament
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  })

  if (!tournament) {
    throw new Error('Tournament not found')
  }

  // Get or create tournament round
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
        status: 'IN_PROGRESS',
        startDate: new Date(),
      },
    })
  }

  // Create traditional 3-round debate
  const debate = await prisma.debate.create({
    data: {
      topic: tournament.name,
      description: `Finals: ${tournament.name}`,
      category: 'OTHER',
      challengerId: participants[0].userId,
      opponentId: participants[1].userId,
      challengerPosition: 'FOR',
      opponentPosition: 'AGAINST',
      totalRounds: 3, // Finals is 3 rounds
      currentRound: 1,
      roundDuration: tournament.roundDuration * 60 * 60 * 1000,
      status: 'ACTIVE',
      challengeType: 'DIRECT',
      roundDeadline: new Date(Date.now() + tournament.roundDuration * 60 * 60 * 1000),
    },
  })

  // Create TournamentMatch for finals
  await prisma.tournamentMatch.create({
    data: {
      tournamentId,
      roundId: round.id,
      participant1Id: participants[0].id,
      participant2Id: participants[1].id,
      debateId: debate.id,
      status: 'IN_PROGRESS',
    },
  })

  console.log(`[King of the Hill] Created finals debate ${debate.id} between ${participants[0].user.username} and ${participants[1].user.username}`)

  return debate.id
}
