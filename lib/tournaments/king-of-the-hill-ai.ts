/**
 * AI Evaluation for King of the Hill Tournament
 * Uses 3 random judges (same as regular debates) to evaluate all participants
 * Each judge scores all participants (0-100), then scores are aggregated
 */

import { prisma } from '@/lib/db/prisma'
import { createDeepSeekClient, logApiUsage } from '@/lib/ai/deepseek'

export interface ParticipantSubmission {
  userId: string
  username: string
  content: string
  round: number
}

export interface JudgeScore {
  judgeId: string
  judgeName: string
  scores: Record<string, number> // userId -> score (0-100)
  reasoning: Record<string, string> // userId -> reasoning
}

export interface KingOfTheHillVerdict {
  judgeScores: JudgeScore[] // Scores from all 3 judges
  totalScores: Record<string, number> // userId -> total score (sum of all 3 judges)
  rankings: Array<{
    userId: string
    username: string
    totalScore: number
    rank: number
  }>
  eliminationExplanations: Record<string, string> // userId -> explanation for why eliminated
  totalParticipants: number
  eliminatedCount: number
}

/**
 * Generate verdict for King of the Hill round using 3 random judges
 * Each judge scores all participants, then scores are aggregated
 */
export async function generateKingOfTheHillVerdict(
  topic: string,
  submissions: ParticipantSubmission[],
  roundNumber: number,
  debateId?: string
): Promise<KingOfTheHillVerdict> {
  if (submissions.length === 0) {
    throw new Error('No submissions to evaluate')
  }

  // Get 3 random judges (same as regular debates)
  const allJudges = await prisma.judge.findMany()
  
  if (allJudges.length === 0) {
    throw new Error('No judges available. Please seed the database with judges.')
  }
  
  console.log(`[King of the Hill] Found ${allJudges.length} judges, selecting 3 for round ${roundNumber}`)

  const selectedJudges = allJudges
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(3, allJudges.length))

  console.log(`[King of the Hill] Selected judges: ${selectedJudges.map(j => j.name).join(', ')}`)

  // Build submissions text for the prompt
  const submissionsText = submissions
    .map((sub, index) => {
      return `Participant ${index + 1} (${sub.username}):
${sub.content}

---`
    })
    .join('\n\n')

  const eliminateCount = Math.max(1, Math.ceil(submissions.length * 0.25))

  // Generate verdicts from each judge in parallel
  const judgeVerdicts = await Promise.all(
    selectedJudges.map(async (judge) => {
      try {
        const client = await createDeepSeekClient()
        const startTime = Date.now()

        const prompt = `You are judging a King of the Hill tournament round. All ${submissions.length} participants have submitted arguments on the same topic.

TOPIC: "${topic}"

ROUND: ${roundNumber}

SUBMISSIONS:
${submissionsText}

Your task:
1. Evaluate each participant's argument quality, reasoning, evidence, and persuasiveness
2. Assign a score (0-100) to EACH participant based on their argument quality
3. Provide a brief reasoning for each participant's score

SCORING CRITERIA (0-100 scale):
- Argument Quality: How well-structured and logical is the argument? (0-25 points)
- Evidence: Does the participant provide supporting evidence or examples? (0-25 points)
- Persuasiveness: How convincing is the argument? (0-25 points)
- Clarity: Is the argument clear and easy to understand? (0-15 points)
- Relevance: Does the argument directly address the topic? (0-10 points)

Respond in the following JSON format (NO markdown code blocks, just pure JSON):
{
  "scores": {
    "${submissions[0].userId}": 85,
    "${submissions[1].userId}": 72,
    ...
  },
  "reasoning": {
    "${submissions[0].userId}": "Strong argument with clear evidence and logical reasoning. The participant effectively addressed the topic.",
    "${submissions[1].userId}": "Good argument with solid points, though some areas could be more developed.",
    ...
  }
}

CRITICAL REQUIREMENTS:
- You MUST score ALL ${submissions.length} participants
- Scores MUST be between 0-100
- Each participant MUST have a score and reasoning
- Be fair, objective, and consistent in your evaluation
- Return ONLY valid JSON, no markdown formatting, no code blocks`

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
          max_tokens: 3000,
        })

        const responseTime = Date.now() - startTime
        const usage = completion.usage

        // Log API usage
        await logApiUsage({
          provider: 'deepseek',
          endpoint: 'chat/completions',
          model: 'deepseek-chat',
          promptTokens: usage?.prompt_tokens,
          completionTokens: usage?.completion_tokens,
          totalTokens: usage?.total_tokens,
          debateId,
          success: true,
          responseTime,
        })

        const responseText = completion.choices[0].message.content || '{}'
        
        // Clean response (remove markdown code blocks if present)
        const cleanedResponse = responseText
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim()

        const verdict = JSON.parse(cleanedResponse) as {
          scores: Record<string, number>
          reasoning: Record<string, string>
        }

        // Validate that all participants have scores
        const scoredUserIds = new Set(Object.keys(verdict.scores || {}))
        for (const submission of submissions) {
          if (!scoredUserIds.has(submission.userId)) {
            console.warn(`[King of the Hill] Judge ${judge.name} did not score participant ${submission.username}, assigning default score 50`)
            verdict.scores[submission.userId] = 50
            verdict.reasoning[submission.userId] = 'No evaluation provided by judge'
          }
        }

        // Validate scores are in range
        for (const [userId, score] of Object.entries(verdict.scores)) {
          if (score < 0 || score > 100) {
            console.warn(`[King of the Hill] Judge ${judge.name} gave invalid score ${score} to ${userId}, clamping to 0-100`)
            verdict.scores[userId] = Math.max(0, Math.min(100, score))
          }
        }

        return {
          judgeId: judge.id,
          judgeName: judge.name,
          scores: verdict.scores,
          reasoning: verdict.reasoning,
        }
      } catch (error: any) {
        console.error(`[King of the Hill] Failed to get verdict from judge ${judge.name}:`, error)
        
        // Fallback: Assign default scores
        const defaultScores: Record<string, number> = {}
        const defaultReasoning: Record<string, string> = {}
        
        submissions.forEach((sub, index) => {
          defaultScores[sub.userId] = 100 - (index * 10) // Decreasing scores
          defaultReasoning[sub.userId] = 'Default score due to evaluation error'
        })

        return {
          judgeId: judge.id,
          judgeName: judge.name,
          scores: defaultScores,
          reasoning: defaultReasoning,
        }
      }
    })
  )

  // Aggregate scores from all 3 judges
  const totalScores: Record<string, number> = {}
  const allReasoning: Record<string, string[]> = {} // userId -> array of reasoning from each judge

  // Initialize totals
  submissions.forEach(sub => {
    totalScores[sub.userId] = 0
    allReasoning[sub.userId] = []
  })

  // Sum up scores from all judges
  judgeVerdicts.forEach((judgeVerdict) => {
    Object.entries(judgeVerdict.scores).forEach(([userId, score]) => {
      totalScores[userId] = (totalScores[userId] || 0) + score
    })
    
    Object.entries(judgeVerdict.reasoning).forEach(([userId, reasoning]) => {
      if (!allReasoning[userId]) {
        allReasoning[userId] = []
      }
      allReasoning[userId].push(`${judgeVerdict.judgeName}: ${reasoning}`)
    })
  })

  // Create rankings based on total scores
  const rankings = submissions
    .map(sub => ({
      userId: sub.userId,
      username: sub.username,
      totalScore: totalScores[sub.userId],
    }))
    .sort((a, b) => b.totalScore - a.totalScore) // Sort descending (highest first)
    .map((participant, index) => ({
      ...participant,
      rank: index + 1, // Rank 1 = best (highest score)
    }))

  // Get bottom 25% (lowest total scores)
  const eliminated = rankings.slice(-eliminateCount)
  const remaining = rankings.slice(0, -eliminateCount)

  // Build elimination explanations from all 3 judges
  const eliminationExplanations: Record<string, string> = {}
  eliminated.forEach((eliminatedParticipant) => {
    const reasoning = allReasoning[eliminatedParticipant.userId] || []
    const explanation = reasoning.length > 0
      ? `Eliminated (Rank ${eliminatedParticipant.rank} of ${submissions.length}, Total Score: ${eliminatedParticipant.totalScore}/300 from 3 judges):\n${reasoning.join('\n\n')}`
      : `Eliminated (Rank ${eliminatedParticipant.rank} of ${submissions.length}, Total Score: ${eliminatedParticipant.totalScore}/300 from 3 judges)`
    eliminationExplanations[eliminatedParticipant.userId] = explanation
  })

  console.log(`[King of the Hill] Round ${roundNumber} Results:`, {
    totalParticipants: submissions.length,
    eliminateCount,
    eliminated: eliminated.map(e => ({ username: e.username, totalScore: e.totalScore, rank: e.rank })),
    remaining: remaining.map(r => ({ username: r.username, totalScore: r.totalScore, rank: r.rank })),
  })

  return {
    judgeScores: judgeVerdicts,
    totalScores,
    rankings,
    eliminationExplanations,
    totalParticipants: submissions.length,
    eliminatedCount: eliminateCount,
  }
}
