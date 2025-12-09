import OpenAI from 'openai'
import { prisma } from '@/lib/db/prisma'
import { logApiUsage } from './api-tracking'

// Get DeepSeek API key from admin settings or environment
export async function getDeepSeekKey(): Promise<string> {
  try {
    const setting = await prisma.adminSetting.findUnique({
      where: { key: 'DEEPSEEK_API_KEY' },
    })

    if (setting) {
      return setting.value
    }
  } catch (error) {
    console.error('Failed to fetch DeepSeek key from admin settings:', error)
  }

  // Fallback to env variable
  const envKey = process.env.DEEPSEEK_API_KEY
  if (!envKey) {
    throw new Error('DeepSeek API key not configured. Please set DEEPSEEK_API_KEY in environment variables or admin settings.')
  }
  return envKey
}

// Create DeepSeek client
export async function createDeepSeekClient() {
  const apiKey = await getDeepSeekKey()
  
  return new OpenAI({
    apiKey,
    baseURL: 'https://api.deepseek.com',
  })
}

export interface DebateContext {
  topic: string
  challengerPosition: string
  opponentPosition: string
  challengerName: string
  opponentName: string
  currentRound: number
  totalRounds: number
  isComplete: boolean
  statements: Array<{
    round: number
    author: string
    position: string
    content: string
  }>
}

export interface VerdictResult {
  winner: 'CHALLENGER' | 'OPPONENT' | 'TIE'
  reasoning: string
  challengerScore: number
  opponentScore: number
}

export async function generateVerdict(
  judgeSystemPrompt: string,
  debateContext: DebateContext,
  options?: {
    debateId?: string
    userId?: string
  }
): Promise<VerdictResult> {
  const client = await createDeepSeekClient()
  const startTime = Date.now()

  // Build debate summary for the judge
  const debateSummary = buildDebateSummary(debateContext)

  // Determine if debate is complete
  const isComplete = debateContext.isComplete && debateContext.currentRound >= debateContext.totalRounds
  
  // Check if debate ended due to time expiration (has "[No submission - Time expired]" statements)
  const hasExpiredStatements = debateContext.statements.some(s => 
    s.content.includes('[No submission - Time expired]') || 
    s.content.includes('Time expired')
  )
  
  const completionNote = isComplete 
    ? 'This debate has been completed with all rounds finished. Judge based on the full set of arguments presented.'
    : hasExpiredStatements
    ? `This debate ended due to time expiration. Some rounds were not completed because participants missed the deadline. Judge based on whatever arguments were submitted before the time expired. If a debater missed a round due to time expiration, consider that as a negative factor in your evaluation - they failed to meet the deadline.`
    : `This debate is incomplete (Round ${debateContext.currentRound}/${debateContext.totalRounds}). Judge based on whatever arguments are available, even if not all rounds were completed. If a debater missed a round, consider that in your evaluation.`

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
          content: `${debateSummary}

${completionNote}

Analyze the available arguments and provide your verdict in the following JSON format:

{
  "winner": "CHALLENGER" | "OPPONENT" | "TIE",
  "reasoning": "Your detailed explanation of why you reached this decision. ${isComplete ? 'Do not mention that the debate is incomplete, as it has been fully completed.' : hasExpiredStatements ? 'Mention that the debate ended due to time expiration and how missed deadlines affected your evaluation.' : 'Mention if the incomplete nature of the debate affected your evaluation.'}",
  "challengerScore": 0-100,
  "opponentScore": 0-100
}

IMPORTANT: Respond ONLY with valid JSON. Do not include any text outside the JSON object.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
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
    
    // Clean response (remove markdown code blocks if present)
    const cleanedResponse = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    try {
      const verdict = JSON.parse(cleanedResponse) as VerdictResult
      
      // Validate verdict structure
      if (!verdict.winner || !verdict.reasoning) {
        throw new Error('Invalid verdict structure')
      }
      
      // Ensure scores are within range
      verdict.challengerScore = Math.max(0, Math.min(100, verdict.challengerScore || 50))
      verdict.opponentScore = Math.max(0, Math.min(100, verdict.opponentScore || 50))
      
      return verdict
    } catch (error) {
      console.error('Failed to parse verdict JSON:', error)
      console.error('Response:', cleanedResponse)
      throw new Error('Failed to parse AI response')
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime
    
    // Log failed API usage
    await logApiUsage({
      provider: 'deepseek',
      endpoint: 'chat/completions',
      model: 'deepseek-chat',
      debateId: options?.debateId,
      userId: options?.userId,
      success: false,
      errorMessage: error.message || 'Unknown error',
      responseTime,
    })
    
    throw error
  }
}

function buildDebateSummary(context: DebateContext): string {
  const { topic, challengerName, opponentName, challengerPosition, opponentPosition, statements, currentRound, totalRounds, isComplete } = context

  let summary = `DEBATE TOPIC: "${topic}"\n\n`
  summary += `DEBATERS:\n`
  summary += `- ${challengerName}: Arguing ${challengerPosition}\n`
  summary += `- ${opponentName}: Arguing ${opponentPosition}\n\n`
  summary += `DEBATE STATUS: ${isComplete && currentRound >= totalRounds ? 'COMPLETED' : `IN PROGRESS - Round ${currentRound} of ${totalRounds}`}\n\n`
  summary += `ARGUMENTS BY ROUND:\n\n`

  // Group statements by round
  const rounds = statements.reduce((acc, statement) => {
    if (!acc[statement.round]) {
      acc[statement.round] = []
    }
    acc[statement.round].push(statement)
    return acc
  }, {} as Record<number, typeof statements>)

  // Format each round
  Object.keys(rounds)
    .map(Number)
    .sort((a, b) => a - b)
    .forEach((roundNum) => {
      const roundStatements = rounds[roundNum]
      summary += `=== ROUND ${roundNum} ===\n\n`
      
      roundStatements.forEach((statement) => {
        summary += `${statement.author} (${statement.position}):\n`
        // Highlight expired submissions
        if (statement.content.includes('[No submission - Time expired]') || statement.content.includes('Time expired')) {
          summary += `[MISSED DEADLINE - NO SUBMISSION]\n`
          summary += `This participant failed to submit their argument before the deadline expired.\n\n`
        } else {
          summary += `${statement.content}\n\n`
        }
      })
    })

  return summary
}

