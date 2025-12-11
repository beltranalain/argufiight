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

  // Get tournament participants who are ACTIVE (not yet eliminated)
  // These are the participants who should be evaluated in this round
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

  // Build context for AI evaluation - only include participants who actually submitted
  const submissions = debate.statements
    .filter(statement => {
      // Only include statements from active tournament participants
      return tournamentParticipants.some(tp => tp.userId === statement.authorId)
    })
    .map((statement) => ({
      userId: statement.authorId,
      username: statement.author.username,
      content: statement.content,
      round: statement.round,
    }))

  if (submissions.length === 0) {
    throw new Error('No submissions found from active tournament participants')
  }

  // Automatically eliminate participants who didn't submit (they get score 0)
  const submittedUserIds = new Set(submissions.map(s => s.userId))
  const participantsWhoDidntSubmit = tournamentParticipants.filter(tp => !submittedUserIds.has(tp.userId))
  
  // Mark non-submitters as eliminated immediately
  for (const nonSubmitter of participantsWhoDidntSubmit) {
    await prisma.tournamentParticipant.update({
      where: { id: nonSubmitter.id },
      data: {
        status: 'ELIMINATED',
        eliminatedAt: new Date(),
        eliminationRound: roundNumber,
        eliminationReason: 'Did not submit an argument for this round',
      },
    })
  }

  console.log(`[King of the Hill] Evaluating ${submissions.length} submissions from ${tournamentParticipants.length} active participants`)
  if (participantsWhoDidntSubmit.length > 0) {
    console.log(`[King of the Hill] Automatically eliminated ${participantsWhoDidntSubmit.length} participant(s) who did not submit`)
  }

  // Call AI to evaluate all submissions together
  const { generateKingOfTheHillVerdict } = await import('./king-of-the-hill-ai')
  const verdictResult = await generateKingOfTheHillVerdict(
    debate.topic,
    submissions,
    roundNumber
  )
  
  // Store the judge's evaluation and update judge stats
  // Use the same judge that was used in the AI evaluation
  const judge = await prisma.judge.findUnique({
    where: { id: verdict.judgeId },
  })
  if (judge) {
    // Update judge stats
    await prisma.judge.update({
      where: { id: judge.id },
      data: {
        debatesJudged: {
          increment: 1,
        },
      },
    })
    
    // Create a Verdict record to store the judge's evaluation
    // For King of the Hill, we'll store the overall evaluation in the reasoning field
    // and use TIE as the decision (since it's not a 1v1 format)
    const verdictSummary = `King of the Hill Round ${roundNumber} Evaluation:\n\n` +
      `Total Participants: ${verdictResult.totalParticipants}\n` +
      `Eliminated: ${verdictResult.eliminatedCount}\n\n` +
      `Rankings:\n${verdictResult.rankings.map((r, i) => 
        `${i + 1}. ${r.username}: Score ${r.score}/100 (Rank ${r.rank})\n   ${r.reasoning}`
      ).join('\n\n')}\n\n` +
      `Elimination Explanations:\n${Object.entries(verdictResult.eliminationExplanations).map(
        ([userId, explanation]) => {
          const participant = verdictResult.rankings.find(r => r.userId === userId)
          return `${participant?.username || userId}: ${explanation}`
        }
      ).join('\n')}`
    
    await prisma.verdict.create({
      data: {
        debateId: debate.id,
        judgeId: judge.id,
        decision: 'TIE', // Not applicable for King of the Hill, but required by schema
        reasoning: verdictSummary,
        challengerScore: null, // Not applicable for King of the Hill
        opponentScore: null, // Not applicable for King of the Hill
        winnerId: null, // Not applicable for King of the Hill
      },
    })
    
    console.log(`[King of the Hill] Created Verdict record for judge ${judge.name} (${judge.id})`)
  }
  
  const verdict = verdictResult

  // Map AI verdict to participant scores
  // Only include tournament participants who actually submitted
  const participantScores: ParticipantScore[] = tournamentParticipants
    .filter(tp => submissions.some(s => s.userId === tp.userId))
    .map((tp) => {
      const verdictEntry = verdict.rankings.find((r) => r.userId === tp.userId)
      if (!verdictEntry) {
        console.warn(`[King of the Hill] No verdict entry found for participant ${tp.user.username} (${tp.userId})`)
      }
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
  
  // Validate that all submissions have rankings
  const rankedUserIds = new Set(verdict.rankings.map(r => r.userId))
  const missingRankings = submissions.filter(s => !rankedUserIds.has(s.userId))
  if (missingRankings.length > 0) {
    console.error(`[King of the Hill] Missing rankings for ${missingRankings.length} submissions:`, 
      missingRankings.map(s => s.username))
  }
  
  // Validate rankings are unique and sequential
  const ranks = verdict.rankings.map(r => r.rank).sort((a, b) => a - b)
  const expectedRanks = Array.from({ length: submissions.length }, (_, i) => i + 1)
  const ranksMatch = ranks.length === expectedRanks.length && 
    ranks.every((rank, index) => rank === expectedRanks[index])
  if (!ranksMatch) {
    console.warn(`[King of the Hill] Rankings validation failed. Expected: [${expectedRanks.join(', ')}], Got: [${ranks.join(', ')}]`)
  }
  
  // Validate scores are in range
  const invalidScores = verdict.rankings.filter(r => r.score < 0 || r.score > 100)
  if (invalidScores.length > 0) {
    console.warn(`[King of the Hill] Invalid scores found (must be 0-100):`, 
      invalidScores.map(r => `${r.username}: ${r.score}`))
  }

  // Sort by score (descending - highest first)
  participantScores.sort((a, b) => b.score - a.score)

  // Calculate how many to eliminate (bottom 25%, minimum 1)
  // Use the number of participants who actually submitted, not total tournament participants
  const totalParticipants = participantScores.length
  const eliminateCount = Math.max(1, Math.ceil(totalParticipants * 0.25))
  
  console.log(`[King of the Hill] Round ${roundNumber}: ${totalParticipants} participants, eliminating bottom ${eliminateCount} (${Math.round((eliminateCount / totalParticipants) * 100)}%)`)

  // Get bottom 25% (lowest scores)
  // slice(-eliminateCount) gets the LAST eliminateCount elements (lowest scores)
  // slice(0, -eliminateCount) gets all EXCEPT the last eliminateCount elements (highest scores)
  const eliminated = participantScores.slice(-eliminateCount)
  const remaining = participantScores.slice(0, -eliminateCount)
  
  console.log(`[King of the Hill] Round ${roundNumber} Elimination Results:`, {
    totalParticipants: totalParticipants,
    eliminateCount: eliminateCount,
    eliminatedCount: eliminated.length,
    remainingCount: remaining.length,
    eliminated: eliminated.map(e => ({ username: e.username, score: e.score, rank: e.rank })),
    remaining: remaining.map(r => ({ username: r.username, score: r.score, rank: r.rank })),
  })

  // Build elimination explanations
  const eliminationExplanations: Record<string, string> = {}
  for (const eliminatedParticipant of eliminated) {
    const explanation = verdict.eliminationExplanations[eliminatedParticipant.userId] || 
      `Ranked ${eliminatedParticipant.rank} out of ${totalParticipants} with a score of ${eliminatedParticipant.score}`
    eliminationExplanations[eliminatedParticipant.participantId] = explanation
  }

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

  // Include non-submitters in eliminated list
  const allEliminatedIds = [
    ...eliminated.map((e) => e.participantId),
    ...participantsWhoDidntSubmit.map((p) => p.id),
  ]

  return {
    eliminatedParticipantIds: allEliminatedIds,
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
