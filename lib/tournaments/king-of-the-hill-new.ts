import { prisma } from '@/lib/db/prisma'
import { generateKingOfTheHillVerdict } from '@/lib/ai/deepseek-king-of-the-hill'

/**
 * Generate verdicts for King of the Hill round
 * Uses the SAME system as regular debates: 3 random judges, each scores all participants 0-100
 */
export async function generateKingOfTheHillRoundVerdicts(
  debateId: string,
  tournamentId: string,
  roundNumber: number
) {
  // Get debate with all participants and statements
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

  if (debate.challengeType !== 'GROUP') {
    throw new Error('This function is only for King of the Hill (GROUP) debates')
  }

  // Get all participants and their submissions
  const participants = debate.participants.map(p => ({
    userId: p.userId,
    username: p.user.username,
  }))

  if (participants.length < 2) {
    throw new Error('Not enough participants for King of the Hill round')
  }

  // Get statements for this round
  const roundStatements = debate.statements.filter(s => s.round === roundNumber)

  // Build submissions map
  const submissions = participants.map(p => {
    const statement = roundStatements.find(s => s.authorId === p.userId)
    return {
      userId: p.userId,
      username: p.username,
      content: statement?.content || '[No submission]',
    }
  })

  // Get EXACTLY 3 random judges (SAME as regular debates - NOT all 7!)
  const allJudges = await prisma.judge.findMany()
  
  if (allJudges.length === 0) {
    throw new Error('No judges available. Please seed the database with judges.')
  }
  
  // Select EXACTLY 3 random judges (SAME as regular debates)
  const selectedJudges = allJudges
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(3, allJudges.length))

  if (selectedJudges.length !== 3) {
    throw new Error(`Expected exactly 3 judges, got ${selectedJudges.length}`)
  }

  console.log(`[King of the Hill] Round ${roundNumber}: Selected EXACTLY 3 judges: ${selectedJudges.map(j => j.name).join(', ')}`)

  // Generate verdicts from each judge in parallel (SAME as regular debates)
  const judgeVerdicts = await Promise.all(
    selectedJudges.map(async (judge) => {
      const verdict = await generateKingOfTheHillVerdict(
        judge.systemPrompt,
        debate.topic,
        submissions,
        roundNumber,
        {
          debateId,
          userId: participants[0].userId,
        }
      )

      return {
        ...verdict,
        judgeId: judge.id,
        judgeName: judge.name,
        judgePersonality: judge.personality,
      }
    })
  )

  // Calculate total scores for each participant (sum of all 3 judges)
  // SAME SYSTEM AS REGULAR DEBATES:
  // - Each judge scores 0-100 per participant
  // - Total score = sum of all 3 judges = 0-300 per participant
  // - Display format: xxx/300 (same as regular debates)
  const totalScores: Record<string, number> = {}
  participants.forEach(p => {
    totalScores[p.userId] = judgeVerdicts.reduce((sum, judgeVerdict) => {
      return sum + (judgeVerdict.scores[p.userId] || 0)
    }, 0)
  })

  // Rank participants by total score (highest first)
  const rankings = participants
    .map(p => ({
      userId: p.userId,
      username: p.username,
      totalScore: totalScores[p.userId],
    }))
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((p, index) => ({
      ...p,
      rank: index + 1, // Rank 1 = best (highest score)
    }))

  // Calculate elimination count (bottom 25%, minimum 1)
  const eliminateCount = Math.max(1, Math.ceil(participants.length * 0.25))
  const eliminated = rankings.slice(-eliminateCount) // Bottom participants
  const remaining = rankings.slice(0, -eliminateCount) // Top participants

  console.log(`[King of the Hill] Round ${roundNumber} Results:`, {
    totalParticipants: participants.length,
    eliminateCount,
    eliminated: eliminated.map(e => ({ username: e.username, totalScore: e.totalScore, rank: e.rank })),
    remaining: remaining.map(r => ({ username: r.username, totalScore: r.totalScore, rank: r.rank })),
  })

  // Store verdicts in database (same format as regular debates)
  // Each judge gets a Verdict record
  // Check if verdicts already exist to prevent duplicates (idempotent operation)
  const existingVerdicts = await prisma.verdict.findMany({
    where: {
      debateId: debate.id,
      judgeId: { in: judgeVerdicts.map(jv => jv.judgeId) },
    },
  })

  const existingJudgeIds = new Set(existingVerdicts.map(v => v.judgeId))

  const storedVerdicts = await Promise.all(
    judgeVerdicts.map(async (judgeVerdict) => {
      // Skip if verdict already exists for this judge
      if (existingJudgeIds.has(judgeVerdict.judgeId)) {
        console.log(`[King of the Hill] Verdict already exists for judge ${judgeVerdict.judgeName}, skipping creation`)
        return existingVerdicts.find(v => v.judgeId === judgeVerdict.judgeId)!
      }

      // Store scores and elimination reasoning in a format the frontend can parse
      // Frontend expects: "username: score/100\n   reasoning\n\nusername2: score/100..."
      const scoresText = participants
        .map(p => {
          const score = judgeVerdict.scores[p.userId] || 0
          return `${p.username}: ${score}/100`
        })
        .join('\n')
      
      const reasoningText = `${scoresText}\n\n---\n\nElimination Reasoning (Why bottom 25% should be eliminated):\n\n${judgeVerdict.overallReasoning}`

      const verdict = await prisma.verdict.create({
        data: {
          debateId: debate.id,
          judgeId: judgeVerdict.judgeId,
          decision: 'TIE', // Not applicable for King of the Hill
          reasoning: reasoningText,
          challengerScore: null, // Not applicable
          opponentScore: null, // Not applicable
          winnerId: null, // Not applicable
        },
      })

      // Update judge stats (only if we created a new verdict)
      await prisma.judge.update({
        where: { id: judgeVerdict.judgeId },
        data: {
          debatesJudged: {
            increment: 1,
          },
        },
      })

      return verdict
    })
  )

  // Update debate status
  await prisma.debate.update({
    where: { id: debateId },
    data: {
      status: 'VERDICT_READY',
    },
  })

  // Get tournament participants to update
  const allTournamentParticipants = await prisma.tournamentParticipant.findMany({
    where: {
      tournamentId,
      userId: { in: participants.map(p => p.userId) },
    },
  })

  // Build elimination reasons from all 3 judges
  // Each judge provides elimination reasoning explaining why the bottom 25% should be eliminated
  const eliminationReasons: Record<string, string> = {}
  eliminated.forEach(eliminatedParticipant => {
    // Get individual scores from each judge (for display)
    const judgeScores = judgeVerdicts.map(jv => {
      const score = jv.scores[eliminatedParticipant.userId] || 0
      return `Judge ${jv.judgeName}: ${score}/100`
    }).join('\n')
    
    // Get elimination reasoning from each judge (explaining why bottom 25% should be eliminated)
    const eliminationReasoning = judgeVerdicts.map(jv => {
      return `Judge ${jv.judgeName}:\n   ${jv.overallReasoning || 'No elimination reasoning provided'}`
    }).join('\n\n')
    
    eliminationReasons[eliminatedParticipant.userId] = 
      `Eliminated (Rank ${eliminatedParticipant.rank} of ${participants.length}, Total Score: ${eliminatedParticipant.totalScore}/300 from 3 judges)\n\n` +
      `Judge Scores:\n${judgeScores}\n\n` +
      `Elimination Reasoning (from all 3 judges):\n${eliminationReasoning}`
  })

  // Update eliminated participants
  await Promise.all(
    allTournamentParticipants
      .filter(tp => eliminated.some(e => e.userId === tp.userId))
      .map(tp => {
        const eliminatedData = eliminated.find(e => e.userId === tp.userId)
        if (eliminatedData) {
          return prisma.tournamentParticipant.update({
            where: { id: tp.id },
            data: {
              status: 'ELIMINATED',
              eliminatedAt: new Date(),
              eliminationRound: roundNumber,
              eliminationReason: eliminationReasons[eliminatedData.userId],
            },
          })
        }
        return Promise.resolve()
      })
  )

  // Mark remaining participants as ACTIVE
  const remainingTournamentParticipants = await prisma.tournamentParticipant.findMany({
    where: {
      tournamentId,
      userId: { in: remaining.map(r => r.userId) },
    },
  })

  await Promise.all(
    remainingTournamentParticipants.map(tp =>
      prisma.tournamentParticipant.update({
        where: { id: tp.id },
        data: {
          status: 'ACTIVE',
        },
      })
    )
  )

  return {
    verdicts: storedVerdicts,
    eliminatedParticipantIds: eliminated.map(e => e.userId),
    remainingParticipantIds: remaining.map(r => r.userId),
    totalScores,
    rankings,
  }
}

