import OpenAI from 'openai'
import { prisma } from '@/lib/db/prisma'
import { createDeepSeekClient } from './deepseek'
import { logApiUsage } from './api-tracking'

export interface ParticipantSubmission {
  userId: string
  username: string
  content: string
}

export interface KingOfTheHillVerdictResult {
  judgeId: string
  judgeName: string
  judgePersonality: string
  scores: Record<string, number> // userId -> score (0-100)
  reasoning: Record<string, string> // userId -> reasoning
  overallReasoning: string // Overall explanation for eliminations
}

/**
 * Generate verdict for King of the Hill round
 * Uses the SAME 3-judge system as regular debates
 * Each judge scores ALL participants (0-100 each)
 */
export async function generateKingOfTheHillVerdict(
  judgeSystemPrompt: string,
  topic: string,
  submissions: ParticipantSubmission[],
  roundNumber: number,
  options?: {
    debateId?: string
    userId?: string
  }
): Promise<KingOfTheHillVerdictResult> {
  const client = await createDeepSeekClient()
  const startTime = Date.now()

  // Build submissions text
  const submissionsText = submissions
    .map((sub, index) => {
      return `Participant ${index + 1} (${sub.username}):
${sub.content || '[No submission]'}

---`
    })
    .join('\n\n')

  const eliminateCount = Math.max(1, Math.ceil(submissions.length * 0.25))

  try {
    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: judgeSystemPrompt,
        },
        {
          role: 'user',
          content: `You are judging a King of the Hill tournament round. All ${submissions.length} participants have submitted arguments on the same topic.

TOPIC: "${topic}"

ROUND: ${roundNumber}

SUBMISSIONS:
${submissionsText}

Your task:
1. Evaluate each participant's argument quality, reasoning, evidence, and persuasiveness
2. Assign a score (0-100) to EACH participant based on their argument quality
3. Provide a brief reasoning for each participant's score
4. Explain why the bottom ${eliminateCount} participant(s) should be eliminated

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
  },
  "eliminationReasoning": "The bottom ${eliminateCount} participant(s) should be eliminated because [explain why based on their scores and argument quality]"
}

CRITICAL REQUIREMENTS:
- You MUST score ALL ${submissions.length} participants
- Scores MUST be between 0-100
- Each participant MUST have a score and reasoning
- Be fair, objective, and consistent in your evaluation
- Return ONLY valid JSON, no markdown formatting, no code blocks`,
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
      debateId: options?.debateId,
      userId: options?.userId,
      success: true,
      responseTime,
    })

    const responseText = completion.choices[0].message.content || '{}'
    
    // Clean response
    const cleanedResponse = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    try {
      const verdict = JSON.parse(cleanedResponse) as {
        scores: Record<string, number>
        reasoning: Record<string, string>
        eliminationReasoning: string
      }

      // Validate that all participants have scores
      const scoredUserIds = new Set(Object.keys(verdict.scores || {}))
      for (const submission of submissions) {
        if (!scoredUserIds.has(submission.userId)) {
          console.warn(`[King of the Hill] Judge did not score participant ${submission.username}, assigning default score 50`)
          verdict.scores[submission.userId] = 50
          verdict.reasoning[submission.userId] = 'No evaluation provided by judge'
        }
      }

      // Validate scores are in range
      for (const [userId, score] of Object.entries(verdict.scores)) {
        if (score < 0 || score > 100) {
          console.warn(`[King of the Hill] Judge gave invalid score ${score} to ${userId}, clamping to 0-100`)
          verdict.scores[userId] = Math.max(0, Math.min(100, score))
        }
      }

      return {
        judgeId: '', // Will be set by caller
        judgeName: '', // Will be set by caller
        judgePersonality: '', // Will be set by caller
        scores: verdict.scores,
        reasoning: verdict.reasoning,
        overallReasoning: verdict.eliminationReasoning || 'No elimination reasoning provided',
      }
    } catch (error: any) {
      console.error('[King of the Hill] Failed to parse AI response:', error)
      console.error('[King of the Hill] Response text:', cleanedResponse.substring(0, 500))
      
      // Return fallback scores
      const fallbackScores: Record<string, number> = {}
      const fallbackReasoning: Record<string, string> = {}
      
      submissions.forEach(sub => {
        fallbackScores[sub.userId] = 50
        fallbackReasoning[sub.userId] = 'Error parsing judge response, default score assigned'
      })

      return {
        judgeId: '',
        judgeName: '',
        judgePersonality: '',
        scores: fallbackScores,
        reasoning: fallbackReasoning,
        overallReasoning: 'Error generating verdict',
      }
    }
  } catch (error: any) {
    console.error('[King of the Hill] Error calling AI:', error)
    
    // Return fallback scores
    const fallbackScores: Record<string, number> = {}
    const fallbackReasoning: Record<string, string> = {}
    
    submissions.forEach(sub => {
      fallbackScores[sub.userId] = 50
      fallbackReasoning[sub.userId] = 'Error generating verdict, default score assigned'
    })

    return {
      judgeId: '',
      judgeName: '',
      judgePersonality: '',
      scores: fallbackScores,
      reasoning: fallbackReasoning,
      overallReasoning: 'Error generating verdict',
    }
  }
}

