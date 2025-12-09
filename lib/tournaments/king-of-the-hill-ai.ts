/**
 * AI Evaluation for King of the Hill Tournament
 * Evaluates all submissions together and ranks participants
 */

import { generateVerdict, type DebateContext } from '@/lib/ai/deepseek'

export interface ParticipantSubmission {
  userId: string
  username: string
  content: string
  round: number
}

export interface ParticipantRanking {
  userId: string
  username: string
  score: number // 0-100
  rank: number // 1 = best, N = worst
  reasoning: string // Why this score/rank
}

export interface KingOfTheHillVerdict {
  rankings: ParticipantRanking[]
  eliminationExplanations: Record<string, string> // userId -> explanation for why eliminated
  totalParticipants: number
  eliminatedCount: number
}

/**
 * Generate verdict for King of the Hill round
 * AI evaluates all submissions together and ranks them
 */
export async function generateKingOfTheHillVerdict(
  topic: string,
  submissions: ParticipantSubmission[],
  roundNumber: number
): Promise<KingOfTheHillVerdict> {
  if (submissions.length === 0) {
    throw new Error('No submissions to evaluate')
  }

  // Build prompt for AI to evaluate all submissions together
  const submissionsText = submissions
    .map((sub, index) => {
      return `Participant ${index + 1} (${sub.username}):
${sub.content}

---`
    })
    .join('\n\n')

  const prompt = `You are judging a King of the Hill tournament round. All participants have submitted arguments on the same topic.

TOPIC: "${topic}"

ROUND: ${roundNumber}

SUBMISSIONS:
${submissionsText}

Your task:
1. Evaluate each participant's argument quality, reasoning, evidence, and persuasiveness
2. Rank all participants from best (1) to worst (${submissions.length})
3. Assign a score (0-100) to each participant
4. Identify the bottom 25% who should be eliminated
5. Provide a clear explanation for why each eliminated participant was removed

Respond in the following JSON format:
{
  "rankings": [
    {
      "userId": "user-id-1",
      "username": "username1",
      "score": 85,
      "rank": 1,
      "reasoning": "Strong argument with clear evidence..."
    },
    ...
  ],
  "eliminationExplanations": {
    "user-id-of-eliminated-1": "This participant was eliminated because...",
    "user-id-of-eliminated-2": "This participant was eliminated because..."
  }
}

IMPORTANT:
- Rankings must be from 1 (best) to ${submissions.length} (worst)
- Scores should be 0-100
- Eliminate the bottom 25% (approximately ${Math.ceil(submissions.length * 0.25)} participants)
- Provide clear, constructive explanations for eliminations
- Be fair and objective in your evaluation`

  try {
    // Use DeepSeek to generate the verdict
    // We'll create a simplified debate context for the AI
    const debateContext: DebateContext = {
      topic,
      challengerName: submissions[0]?.username || 'Participant 1',
      opponentName: submissions[1]?.username || 'Participant 2',
      challengerPosition: 'FOR',
      opponentPosition: 'AGAINST',
      currentRound: roundNumber,
      totalRounds: 1,
      isComplete: true,
      statements: submissions.map((sub) => ({
        round: sub.round,
        author: sub.username,
        position: 'FOR' as const,
        content: sub.content,
      })),
    }

    // Get a judge (we'll use the first available judge)
    const judges = await prisma.judge.findMany()
    if (judges.length === 0) {
      throw new Error('No judges available')
    }

    const judge = judges[0]

    // Generate verdict using DeepSeek
    // Note: We'll need to adapt this to handle multi-participant evaluation
    // For now, we'll use a custom prompt approach
    const { createDeepSeekClient } = await import('@/lib/ai/deepseek')
    const client = await createDeepSeekClient()

    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: judge.systemPrompt || 'You are an expert debate judge evaluating arguments fairly and objectively.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    })

    const responseText = completion.choices[0].message.content || '{}'
    
    // Clean response (remove markdown code blocks if present)
    const cleanedResponse = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const verdict = JSON.parse(cleanedResponse) as KingOfTheHillVerdict

    // Validate and normalize the verdict
    if (!verdict.rankings || !Array.isArray(verdict.rankings)) {
      throw new Error('Invalid verdict format: missing rankings')
    }

    // Ensure all submissions have rankings
    const rankedUserIds = new Set(verdict.rankings.map((r) => r.userId))
    for (const submission of submissions) {
      if (!rankedUserIds.has(submission.userId)) {
        // Add missing participant with default score
        verdict.rankings.push({
          userId: submission.userId,
          username: submission.username,
          score: 50,
          rank: verdict.rankings.length + 1,
          reasoning: 'No evaluation provided',
        })
      }
    }

    // Sort by rank (1 = best)
    verdict.rankings.sort((a, b) => a.rank - b.rank)

    // Calculate elimination count
    const eliminateCount = Math.max(1, Math.ceil(submissions.length * 0.25))
    const eliminatedCount = eliminateCount
    verdict.eliminatedCount = eliminatedCount
    verdict.totalParticipants = submissions.length

    // Ensure elimination explanations exist for bottom 25%
    const eliminated = verdict.rankings.slice(-eliminateCount)
    if (!verdict.eliminationExplanations) {
      verdict.eliminationExplanations = {}
    }

    for (const eliminatedParticipant of eliminated) {
      if (!verdict.eliminationExplanations[eliminatedParticipant.userId]) {
        verdict.eliminationExplanations[eliminatedParticipant.userId] = 
          `Ranked ${eliminatedParticipant.rank} out of ${submissions.length} with a score of ${eliminatedParticipant.score}. ${eliminatedParticipant.reasoning}`
      }
    }

    return verdict
  } catch (error: any) {
    console.error('[King of the Hill AI] Failed to generate verdict:', error)
    
    // Fallback: Create default rankings based on submission order
    const defaultRankings: ParticipantRanking[] = submissions.map((sub, index) => ({
      userId: sub.userId,
      username: sub.username,
      score: 100 - (index * 10), // Decreasing scores
      rank: index + 1,
      reasoning: 'Default ranking due to evaluation error',
    }))

    const eliminateCount = Math.max(1, Math.ceil(submissions.length * 0.25))
    const eliminated = defaultRankings.slice(-eliminateCount)
    const eliminationExplanations: Record<string, string> = {}
    
    for (const eliminatedParticipant of eliminated) {
      eliminationExplanations[eliminatedParticipant.userId] = 
        `Ranked ${eliminatedParticipant.rank} out of ${submissions.length} with a score of ${eliminatedParticipant.score}`
    }

    return {
      rankings: defaultRankings,
      eliminationExplanations,
      totalParticipants: submissions.length,
      eliminatedCount: eliminateCount,
    }
  }
}

import { prisma } from '@/lib/db/prisma'

