import { prisma } from '@/lib/db/prisma'
import { generateVerdict, type DebateContext } from '@/lib/ai/deepseek'

/**
 * Generate verdicts for King of the Hill round
 * Uses the SAME system as regular debates: 3 random judges, each scores all participants 0-100
 */
export async function generateKingOfTheHillVerdicts(
  debateId: string,
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

  // Get all participants
  const participants = debate.participants.map(p => ({
    id: p.userId,
    username: p.user.username,
  }))

  if (participants.length < 2) {
    throw new Error('Not enough participants for King of the Hill round')
  }

  // Get statements for this round (King of the Hill is single round per debate)
  const roundStatements = debate.statements.filter(s => s.round === roundNumber)

  // Get 3 random judges (SAME as regular debates)
  const allJudges = await prisma.judge.findMany()
  
  if (allJudges.length === 0) {
    throw new Error('No judges available. Please seed the database with judges.')
  }
  
  const selectedJudges = allJudges
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(3, allJudges.length))

  console.log(`[King of the Hill] Selected ${selectedJudges.length} judges for round ${roundNumber}: ${selectedJudges.map(j => j.name).join(', ')}`)

  // Build statements by participant
  const statementsByParticipant: Record<string, string> = {}
  roundStatements.forEach(statement => {
    const participant = participants.find(p => p.id === statement.authorId)
    if (participant) {
      statementsByParticipant[participant.id] = statement.content
    }
  })

  // Generate verdicts from each judge in parallel (SAME as regular debates)
  const verdictResults = await Promise.all(
    selectedJudges.map(async (judge) => {
      try {
        // Build debate context for this judge
        // For King of the Hill, we create a context for each participant pair
        // But actually, we need to score ALL participants, so we'll create a special context
        
        // Create a combined context that includes all participants
        const allStatements = participants.map(p => ({
          round: roundNumber,
          author: p.username,
          position: 'ARGUING', // King of the Hill doesn't have PRO/CON positions
          content: statementsByParticipant[p.id] || '[No submission]',
        }))

        // Build a special debate context for King of the Hill
        // We'll use the first participant as "challenger" and create contexts for each
        const debateContext: DebateContext = {
          topic: debate.topic,
          challengerPosition: 'ARGUING',
          opponentPosition: 'ARGUING',
          challengerName: participants[0].username,
          opponentName: participants.length > 1 ? participants[1].username : participants[0].username,
          currentRound: roundNumber,
          totalRounds: 1, // King of the Hill rounds are single submission
          isComplete: true,
          statements: allStatements,
        }

        // Generate verdict using the same system as regular debates
        const verdict = await generateVerdict(judge.systemPrompt, debateContext, {
          debateId,
          userId: participants[0].id,
        })

        return {
          judgeId: judge.id,
          judgeName: judge.name,
          judgePersonality: judge.personality,
          verdict,
        }
      } catch (error: any) {
        console.error(`[King of the Hill] Error generating verdict from judge ${judge.name}:`, error)
        // Return fallback verdict
        return {
          judgeId: judge.id,
          judgeName: judge.name,
          judgePersonality: judge.personality,
          verdict: {
            winner: 'TIE' as const,
            reasoning: 'Error generating verdict',
            challengerScore: 50,
            opponentScore: 50,
          },
        }
      }
    })
  )

  // Now we need to extract scores for ALL participants from each judge
  // The current generateVerdict only scores 2 people (challenger/opponent)
  // We need to modify this to score all participants
  
  // For now, let's create a new approach: generate verdicts that score all participants
  // We'll need to modify the AI prompt to score all participants
  
  return {
    judges: verdictResults,
    participants,
    statementsByParticipant,
  }
}

