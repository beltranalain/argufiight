# PART 7: AI INTEGRATION

DeepSeek API integration for AI judge verdicts.

---

## OVERVIEW

This part covers:
- DeepSeek API client
- Judge personality system
- Verdict generation
- API key retrieval from admin settings
- Verdict display component

---

## DEEPSEEK INTEGRATION

### File: lib/ai/deepseek.ts

```typescript
import OpenAI from 'openai'
import { prisma } from '@/lib/db/prisma'

// Get DeepSeek API key from admin settings
async function getDeepSeekKey(): Promise<string> {
  const setting = await prisma.adminSetting.findUnique({
    where: { key: 'DEEPSEEK_API_KEY' },
  })

  if (!setting) {
    // Fallback to env variable
    const envKey = process.env.DEEPSEEK_API_KEY
    if (!envKey) {
      throw new Error('DeepSeek API key not configured')
    }
    return envKey
  }

  return setting.value
}

// Create DeepSeek client
async function createDeepSeekClient() {
  const apiKey = await getDeepSeekKey()
  
  return new OpenAI({
    apiKey,
    baseURL: 'https://api.deepseek.com',
  })
}

interface DebateContext {
  topic: string
  challengerPosition: string
  opponentPosition: string
  challengerName: string
  opponentName: string
  statements: Array<{
    round: number
    author: string
    position: string
    content: string
  }>
}

export async function generateVerdict(
  judgeSystemPrompt: string,
  debateContext: DebateContext
) {
  const client = await createDeepSeekClient()

  // Build debate summary for the judge
  const debateSummary = buildDebateSummary(debateContext)

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

Analyze both debaters' complete arguments and provide your verdict in the following JSON format:

{
  "winner": "CHALLENGER" | "OPPONENT" | "TIE",
  "reasoning": "Your detailed explanation of why you reached this decision",
  "challengerScore": 0-100,
  "opponentScore": 0-100
}

IMPORTANT: Respond ONLY with valid JSON. Do not include any text outside the JSON object.`,
      },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  })

  const responseText = completion.choices[0].message.content || '{}'
  
  // Clean response (remove markdown code blocks if present)
  const cleanedResponse = responseText
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  try {
    const verdict = JSON.parse(cleanedResponse)
    return verdict
  } catch (error) {
    console.error('Failed to parse verdict JSON:', error)
    console.error('Response:', cleanedResponse)
    throw new Error('Failed to parse AI response')
  }
}

function buildDebateSummary(context: DebateContext): string {
  const { topic, challengerName, opponentName, challengerPosition, opponentPosition, statements } = context

  let summary = `DEBATE TOPIC: "${topic}"\n\n`
  summary += `DEBATERS:\n`
  summary += `- ${challengerName}: Arguing ${challengerPosition}\n`
  summary += `- ${opponentName}: Arguing ${opponentPosition}\n\n`
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
  Object.keys(rounds).sort().forEach((roundNum) => {
    const roundStatements = rounds[Number(roundNum)]
    summary += `=== ROUND ${roundNum} ===\n\n`
    
    roundStatements.forEach((statement) => {
      summary += `${statement.author} (${statement.position}):\n`
      summary += `${statement.content}\n\n`
    })
  })

  return summary
}
```

---

### File: app/api/verdicts/generate/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { generateVerdict } from '@/lib/ai/deepseek'

export async function POST(request: NextRequest) {
  try {
    const { debateId } = await request.json()

    // Get debate with all data
    const debate = await prisma.debate.findUnique({
      where: { id: debateId },
      include: {
        challenger: true,
        opponent: true,
        statements: {
          include: {
            author: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    if (!debate) {
      return NextResponse.json(
        { error: 'Debate not found' },
        { status: 404 }
      )
    }

    if (debate.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Debate is not completed' },
        { status: 400 }
      )
    }

    // Get 3 random judges
    const allJudges = await prisma.judge.findMany()
    const selectedJudges = allJudges
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)

    // Build debate context
    const debateContext = {
      topic: debate.topic,
      challengerPosition: debate.challengerPosition,
      opponentPosition: debate.opponentPosition,
      challengerName: debate.challenger.username,
      opponentName: debate.opponent!.username,
      statements: debate.statements.map((s) => ({
        round: s.round,
        author: s.author.username,
        position: s.authorId === debate.challengerId
          ? debate.challengerPosition
          : debate.opponentPosition,
        content: s.content,
      })),
    }

    // Generate verdicts from each judge
    const verdicts = await Promise.all(
      selectedJudges.map(async (judge) => {
        const verdict = await generateVerdict(judge.systemPrompt, debateContext)

        // Map winner to user ID
        let winnerId: string | null = null
        if (verdict.winner === 'CHALLENGER') {
          winnerId = debate.challengerId
        } else if (verdict.winner === 'OPPONENT') {
          winnerId = debate.opponentId
        }

        // Determine decision enum
        let decision: 'CHALLENGER_WINS' | 'OPPONENT_WINS' | 'TIE'
        if (verdict.winner === 'CHALLENGER') {
          decision = 'CHALLENGER_WINS'
        } else if (verdict.winner === 'OPPONENT') {
          decision = 'OPPONENT_WINS'
        } else {
          decision = 'TIE'
        }

        return {
          judgeId: judge.id,
          winnerId,
          decision,
          reasoning: verdict.reasoning,
          challengerScore: verdict.challengerScore,
          opponentScore: verdict.opponentScore,
        }
      })
    )

    // Save verdicts to database
    await Promise.all(
      verdicts.map((verdict) =>
        prisma.verdict.create({
          data: {
            debateId,
            ...verdict,
          },
        })
      )
    )

    // Update judge stats
    await Promise.all(
      selectedJudges.map((judge) =>
        prisma.judge.update({
          where: { id: judge.id },
          data: {
            debatesJudged: {
              increment: 1,
            },
          },
        })
      )
    )

    // Determine overall winner (majority vote)
    const challengerVotes = verdicts.filter((v) => v.decision === 'CHALLENGER_WINS').length
    const opponentVotes = verdicts.filter((v) => v.decision === 'OPPONENT_WINS').length
    const tieVotes = verdicts.filter((v) => v.decision === 'TIE').length

    let finalWinnerId: string | null = null
    if (challengerVotes > opponentVotes && challengerVotes > tieVotes) {
      finalWinnerId = debate.challengerId
    } else if (opponentVotes > challengerVotes && opponentVotes > tieVotes) {
      finalWinnerId = debate.opponentId
    }

    // Calculate ELO changes
    const challengerElo = debate.challenger.eloRating
    const opponentElo = debate.opponent!.eloRating
    
    const { challengerChange, opponentChange } = calculateEloChange(
      challengerElo,
      opponentElo,
      finalWinnerId === debate.challengerId ? 1 : finalWinnerId === debate.opponentId ? 0 : 0.5
    )

    // Update debate with verdict
    await prisma.debate.update({
      where: { id: debateId },
      data: {
        status: 'VERDICT_READY',
        verdictReached: true,
        verdictDate: new Date(),
        winnerId: finalWinnerId,
        challengerEloChange: challengerChange,
        opponentEloChange: opponentChange,
      },
    })

    // Update user stats and ELO
    await prisma.profile.update({
      where: { id: debate.challengerId },
      data: {
        eloRating: { increment: challengerChange },
        totalDebates: { increment: 1 },
        debatesWon: { increment: finalWinnerId === debate.challengerId ? 1 : 0 },
        debatesLost: { increment: finalWinnerId === debate.opponentId ? 1 : 0 },
        debatesTied: { increment: finalWinnerId === null ? 1 : 0 },
      },
    })

    await prisma.profile.update({
      where: { id: debate.opponentId! },
      data: {
        eloRating: { increment: opponentChange },
        totalDebates: { increment: 1 },
        debatesWon: { increment: finalWinnerId === debate.opponentId ? 1 : 0 },
        debatesLost: { increment: finalWinnerId === debate.challengerId ? 1 : 0 },
        debatesTied: { increment: finalWinnerId === null ? 1 : 0 },
      },
    })

    // Create notifications
    const result = finalWinnerId === debate.challengerId
      ? 'won'
      : finalWinnerId === debate.opponentId
      ? 'lost'
      : 'tied'

    await prisma.notification.createMany({
      data: [
        {
          userId: debate.challengerId,
          type: `DEBATE_${result.toUpperCase()}` as any,
          title: `Verdict: You ${result}!`,
          message: `The judges have decided on "${debate.topic}"`,
          debateId,
        },
        {
          userId: debate.opponentId!,
          type: `DEBATE_${finalWinnerId === debate.opponentId ? 'WON' : finalWinnerId === debate.challengerId ? 'LOST' : 'TIED'}` as any,
          title: `Verdict: You ${finalWinnerId === debate.opponentId ? 'won' : finalWinnerId === debate.challengerId ? 'lost' : 'tied'}!`,
          message: `The judges have decided on "${debate.topic}"`,
          debateId,
        },
      ],
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to generate verdicts:', error)
    return NextResponse.json(
      { error: 'Failed to generate verdicts' },
      { status: 500 }
    )
  }
}

// ELO rating calculation
function calculateEloChange(
  challengerElo: number,
  opponentElo: number,
  result: number // 1 = challenger wins, 0 = opponent wins, 0.5 = tie
) {
  const K = 32 // K-factor

  const expectedChallenger = 1 / (1 + Math.pow(10, (opponentElo - challengerElo) / 400))
  const expectedOpponent = 1 / (1 + Math.pow(10, (challengerElo - opponentElo) / 400))

  const challengerChange = Math.round(K * (result - expectedChallenger))
  const opponentChange = Math.round(K * ((1 - result) - expectedOpponent))

  return { challengerChange, opponentChange }
}
```

---

## CURSOR.AI PROMPTS

### PROMPT 1: Verdict Display Component

```
Create a beautiful verdict display component:

File: components/debate/VerdictDisplay.tsx

'use client'

import { motion } from 'framer-motion'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'

interface VerdictDisplayProps {
  debate: any
}

export function VerdictDisplay({ debate }: VerdictDisplayProps) {
  const verdicts = debate.verdicts || []
  
  const challengerVotes = verdicts.filter((v: any) => v.decision === 'CHALLENGER_WINS').length
  const opponentVotes = verdicts.filter((v: any) => v.decision === 'OPPONENT_WINS').length
  const tieVotes = verdicts.filter((v: any) => v.decision === 'TIE').length

  const winner = debate.winnerId === debate.challengerId
    ? 'CHALLENGER'
    : debate.winnerId === debate.opponentId
    ? 'OPPONENT'
    : 'TIE'

  return (
    <div className="space-y-6">
      
      {/* Winner Announcement */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <h2 className="text-5xl font-bold mb-4">
          {winner === 'TIE' ? (
            <span className="text-text-secondary">It's a Tie!</span>
          ) : (
            <span className="bg-gradient-to-r from-electric-blue to-neon-orange bg-clip-text text-transparent">
              {winner === 'CHALLENGER' ? debate.challenger.username : debate.opponent.username} Wins!
            </span>
          )}
        </h2>

        {/* Vote Count */}
        <div className="flex items-center justify-center gap-8 mb-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-electric-blue mb-2">
              {challengerVotes}
            </div>
            <div className="text-sm text-text-secondary">Votes for {debate.challenger.username}</div>
          </div>

          <div className="text-3xl text-text-muted">-</div>

          <div className="text-center">
            <div className="text-4xl font-bold text-neon-orange mb-2">
              {opponentVotes}
            </div>
            <div className="text-sm text-text-secondary">Votes for {debate.opponent.username}</div>
          </div>

          {tieVotes > 0 && (
            <>
              <div className="text-3xl text-text-muted">-</div>
              <div className="text-center">
                <div className="text-4xl font-bold text-text-secondary mb-2">
                  {tieVotes}
                </div>
                <div className="text-sm text-text-secondary">Tie Votes</div>
              </div>
            </>
          )}
        </div>

        {/* ELO Changes */}
        <div className="flex items-center justify-center gap-8">
          <div className="flex items-center gap-3">
            <Avatar
              src={debate.challenger.avatarUrl}
              username={debate.challenger.username}
              size="md"
            />
            <div>
              <div className="text-white font-bold">{debate.challenger.username}</div>
              <div className={`text-lg font-bold ${
                debate.challengerEloChange >= 0 ? 'text-cyber-green' : 'text-neon-orange'
              }`}>
                {debate.challengerEloChange >= 0 ? '+' : ''}{debate.challengerEloChange} ELO
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Avatar
              src={debate.opponent.avatarUrl}
              username={debate.opponent.username}
              size="md"
            />
            <div>
              <div className="text-white font-bold">{debate.opponent.username}</div>
              <div className={`text-lg font-bold ${
                debate.opponentEloChange >= 0 ? 'text-cyber-green' : 'text-neon-orange'
              }`}>
                {debate.opponentEloChange >= 0 ? '+' : ''}{debate.opponentEloChange} ELO
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Judge Verdicts */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-6">Judge Verdicts</h3>
        
        <div className="space-y-4">
          {verdicts.map((verdict: any) => (
            <motion.div
              key={verdict.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className={`border-l-4 ${
                verdict.decision === 'CHALLENGER_WINS'
                  ? 'border-electric-blue'
                  : verdict.decision === 'OPPONENT_WINS'
                  ? 'border-neon-orange'
                  : 'border-text-muted'
              }`}>
                <CardBody>
                  {/* Judge Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{verdict.judge.emoji}</div>
                      <div>
                        <h4 className="font-bold text-white">{verdict.judge.name}</h4>
                        <p className="text-sm text-text-muted">{verdict.judge.personality}</p>
                      </div>
                    </div>
                    
                    <Badge
                      variant={
                        verdict.decision === 'CHALLENGER_WINS'
                          ? 'success'
                          : verdict.decision === 'OPPONENT_WINS'
                          ? 'warning'
                          : 'default'
                      }
                    >
                      {verdict.decision === 'CHALLENGER_WINS'
                        ? `${debate.challenger.username} Wins`
                        : verdict.decision === 'OPPONENT_WINS'
                        ? `${debate.opponent.username} Wins`
                        : 'Tie'}
                    </Badge>
                  </div>

                  {/* Scores */}
                  <div className="flex gap-4 mb-4">
                    <div className="flex-1">
                      <div className="text-sm text-text-secondary mb-1">
                        {debate.challenger.username}
                      </div>
                      <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-electric-blue"
                          style={{ width: `${verdict.challengerScore}%` }}
                        />
                      </div>
                      <div className="text-sm font-bold text-electric-blue mt-1">
                        {verdict.challengerScore}/100
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="text-sm text-text-secondary mb-1">
                        {debate.opponent.username}
                      </div>
                      <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-neon-orange"
                          style={{ width: `${verdict.opponentScore}%` }}
                        />
                      </div>
                      <div className="text-sm font-bold text-neon-orange mt-1">
                        {verdict.opponentScore}/100
                      </div>
                    </div>
                  </div>

                  {/* Reasoning */}
                  <div className="bg-bg-tertiary rounded-lg p-4">
                    <p className="text-sm font-semibold text-white mb-2">Reasoning:</p>
                    <p className="text-text-primary leading-relaxed">
                      {verdict.reasoning}
                    </p>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

---

## IMPLEMENTATION ORDER

1. Install OpenAI SDK: `npm install openai`
2. Create lib/ai/deepseek.ts
3. Create API route for verdict generation
4. Run Prompt 1 (Verdict Display Component)
5. Test verdict generation with completed debate

---

## TESTING VERDICT GENERATION

1. Complete a debate (both users submit all rounds)
2. Debate status should change to COMPLETED
3. Verdict generation triggers automatically
4. Check database for verdict records
5. Verify ELO updates for both users
6. View verdict display on debate page

PART 7 COMPLETE!
