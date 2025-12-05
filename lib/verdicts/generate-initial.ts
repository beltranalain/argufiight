import { prisma } from '@/lib/db/prisma'
import { generateVerdict, type DebateContext } from '@/lib/ai/deepseek'
import { updateUserAnalyticsOnDebateComplete } from '@/lib/utils/analytics'

// Simplified ELO calculation
function calculateEloChange(
  playerElo: number,
  opponentElo: number,
  result: number // 1 = win, 0 = loss, 0.5 = tie
): number {
  const K = 32 // ELO K-factor
  const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400))
  const change = Math.round(K * (result - expectedScore))
  return change
}

/**
 * Generate initial verdicts for a completed debate
 * This function can be called directly without HTTP fetch
 */
export async function generateInitialVerdicts(debateId: string) {
  try {
    // Get debate with all data
    const debate = await prisma.debate.findUnique({
      where: { id: debateId },
      include: {
        challenger: {
          select: {
            id: true,
            username: true,
            eloRating: true,
          }
        },
        opponent: {
          select: {
            id: true,
            username: true,
            eloRating: true,
          }
        },
        statements: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
              }
            }
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

    // Accept both COMPLETED and VERDICT_READY statuses
    if (debate.status !== 'COMPLETED' && debate.status !== 'VERDICT_READY') {
      throw new Error(`Debate is not completed (current status: ${debate.status})`)
    }
    
    // If already VERDICT_READY, check if verdicts exist
    if (debate.status === 'VERDICT_READY') {
      const existingVerdicts = await prisma.verdict.count({
        where: { debateId },
      })
      if (existingVerdicts > 0) {
        throw new Error('Verdicts already generated for this debate')
      }
    }

    if (!debate.opponent) {
      throw new Error('Debate must have an opponent')
    }

    // Check if verdicts already exist (only if status is COMPLETED)
    if (debate.status === 'COMPLETED') {
      const existingVerdicts = await prisma.verdict.count({
        where: { debateId },
      })

      if (existingVerdicts > 0) {
        throw new Error('Verdicts already generated for this debate')
      }
    }

    // Get 3 random judges
    const allJudges = await prisma.judge.findMany()
    
    if (allJudges.length === 0) {
      throw new Error('No judges available. Please seed the database with judges using: npm run seed:all')
    }
    
    console.log(`[Generate Verdicts] Found ${allJudges.length} active judges, selecting 3 for debate ${debateId}`)

    const selectedJudges = allJudges
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(3, allJudges.length))

    // Build debate context
    const debateContext: DebateContext = {
      topic: debate.topic,
      challengerPosition: debate.challengerPosition,
      opponentPosition: debate.opponentPosition,
      challengerName: debate.challenger.username,
      opponentName: debate.opponent.username,
      statements: debate.statements.map((s) => ({
        round: s.round,
        author: s.author.username,
        position: s.author.id === debate.challengerId
          ? debate.challengerPosition
          : debate.opponentPosition,
        content: s.content,
      })),
    }

    // Check if DeepSeek API key is configured
    try {
      const { getDeepSeekKey } = await import('@/lib/ai/deepseek')
      await getDeepSeekKey() // This will throw if not configured
    } catch (error: any) {
      console.error('DeepSeek API key not configured:', error.message)
      throw new Error('AI service not configured. Please set DEEPSEEK_API_KEY in admin settings or environment variables')
    }

    console.log(`[Generate Verdicts] Generating verdicts for debate ${debateId} with ${selectedJudges.length} judges`)

    // Generate verdicts from each judge in parallel
    const verdicts = await Promise.all(
      selectedJudges.map(async (judge) => {
        try {
          console.log(`[Generate Verdicts] Starting verdict for judge: ${judge.name} (${judge.id})`)
          const verdict = await generateVerdict(judge.systemPrompt, debateContext, {
            debateId,
            userId: debate.challengerId, // Track as challenger's usage
          })
          console.log(`[Generate Verdicts] ✅ Successfully generated verdict from ${judge.name}:`, {
            winner: verdict.winner,
            challengerScore: verdict.challengerScore,
            opponentScore: verdict.opponentScore
          })

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
        } catch (error: any) {
          console.error(`[Generate Verdicts] ❌ Failed to generate verdict for judge ${judge.name}:`, {
            judgeId: judge.id,
            error: error.message,
            stack: error.stack,
            debateId
          })
          // Return a default verdict if AI generation fails
          return {
            judgeId: judge.id,
            winnerId: null,
            decision: 'TIE' as const,
            reasoning: `Unable to generate verdict due to technical error: ${error.message}`,
            challengerScore: 50,
            opponentScore: 50,
          }
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
    // If tie or no clear majority, winnerId remains null

    // Calculate ELO changes (simplified ELO system)
    const challengerEloChange = calculateEloChange(
      debate.challenger.eloRating ?? 1200,
      debate.opponent.eloRating ?? 1200,
      finalWinnerId === debate.challengerId ? 1 : finalWinnerId === debate.opponentId ? 0 : 0.5
    )
    const opponentEloChange = -challengerEloChange

    // Update debate with final winner and ELO changes
    const updatedDebate = await prisma.debate.update({
      where: { id: debateId },
      data: {
        status: 'VERDICT_READY',
        winnerId: finalWinnerId,
        verdictReached: true,
        verdictDate: new Date(),
        challengerEloChange,
        opponentEloChange,
      },
    })

    // Calculate total scores from verdicts
    const challengerTotalScore = verdicts.reduce((sum, v) => sum + (v.challengerScore ?? 0), 0)
    const opponentTotalScore = verdicts.reduce((sum, v) => sum + (v.opponentScore ?? 0), 0)
    const maxScoreForDebate = verdicts.length * 100 // Each judge can give up to 100 points

    // Update user stats
    if (finalWinnerId === debate.challengerId) {
      await prisma.user.update({
        where: { id: debate.challengerId },
        data: {
          debatesWon: { increment: 1 },
          totalDebates: { increment: 1 },
          eloRating: { increment: challengerEloChange },
          totalScore: { increment: challengerTotalScore },
          totalMaxScore: { increment: maxScoreForDebate },
        },
      })
      if (debate.opponentId) {
        await prisma.user.update({
          where: { id: debate.opponentId },
          data: {
            debatesLost: { increment: 1 },
            totalDebates: { increment: 1 },
            eloRating: { increment: opponentEloChange },
            totalScore: { increment: opponentTotalScore },
            totalMaxScore: { increment: maxScoreForDebate },
          },
        })
      }
    } else if (finalWinnerId === debate.opponentId) {
      if (debate.opponentId) {
        await prisma.user.update({
          where: { id: debate.opponentId },
          data: {
            debatesWon: { increment: 1 },
            totalDebates: { increment: 1 },
            eloRating: { increment: opponentEloChange },
            totalScore: { increment: opponentTotalScore },
            totalMaxScore: { increment: maxScoreForDebate },
          },
        })
      }
      await prisma.user.update({
        where: { id: debate.challengerId },
        data: {
          debatesLost: { increment: 1 },
          totalDebates: { increment: 1 },
          eloRating: { increment: challengerEloChange },
          totalScore: { increment: challengerTotalScore },
          totalMaxScore: { increment: maxScoreForDebate },
        },
      })
    } else {
      // Tie
      await prisma.user.update({
        where: { id: debate.challengerId },
        data: {
          debatesTied: { increment: 1 },
          totalDebates: { increment: 1 },
          eloRating: { increment: challengerEloChange },
          totalScore: { increment: challengerTotalScore },
          totalMaxScore: { increment: maxScoreForDebate },
        },
      })
      if (debate.opponentId) {
        await prisma.user.update({
          where: { id: debate.opponentId },
          data: {
            debatesTied: { increment: 1 },
            totalDebates: { increment: 1 },
            eloRating: { increment: opponentEloChange },
            totalScore: { increment: opponentTotalScore },
            totalMaxScore: { increment: maxScoreForDebate },
          },
        })
      }
    }

    // Create notifications for participants
    const notifications = [
      prisma.notification.create({
        data: {
          userId: debate.challengerId,
          type: finalWinnerId === debate.challengerId ? 'DEBATE_WON' : finalWinnerId === debate.opponentId ? 'DEBATE_LOST' : 'DEBATE_TIED',
          title: finalWinnerId === debate.challengerId ? 'You Won!' : finalWinnerId === debate.opponentId ? 'You Lost' : 'Debate Tied',
          message: `The verdict for "${debate.topic}" is ready!`,
          debateId,
        },
      }),
    ]
    
    if (debate.opponentId) {
      notifications.push(
        prisma.notification.create({
          data: {
            userId: debate.opponentId,
            type: finalWinnerId === debate.opponentId ? 'DEBATE_WON' : finalWinnerId === debate.challengerId ? 'DEBATE_LOST' : 'DEBATE_TIED',
            title: finalWinnerId === debate.opponentId ? 'You Won!' : finalWinnerId === debate.challengerId ? 'You Lost' : 'Debate Tied',
            message: `The verdict for "${debate.topic}" is ready!`,
            debateId,
          },
        })
      )
    }
    
    await Promise.all(notifications)

    // Update user analytics for average rounds (non-blocking)
    updateUserAnalyticsOnDebateComplete(debate.challengerId, debate.totalRounds).catch(err => {
      console.error('Failed to update challenger analytics:', err)
    })
    if (debate.opponentId) {
      updateUserAnalyticsOnDebateComplete(debate.opponentId, debate.totalRounds).catch(err => {
        console.error('Failed to update opponent analytics:', err)
      })
    }

    return {
      success: true,
      debate: updatedDebate,
      verdicts: verdicts.length,
    }
  } catch (error: any) {
    console.error('[Generate Verdicts] Error:', error)
    throw error
  }
}

