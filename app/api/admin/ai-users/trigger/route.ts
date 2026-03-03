import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

// GET /api/admin/ai-users/trigger — manually trigger AI auto-accept + responses (admin only)
export async function GET() {
  try {
    const userId = await verifyAdmin()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results: any = { aiUsers: [], openChallenges: [], autoAccept: null, responses: null, errors: [] }

    // 1. Check AI users status
    const aiUsers = await prisma.user.findMany({
      where: { isAI: true },
      select: { id: true, username: true, isAI: true, aiPaused: true, aiPersonality: true, aiResponseDelay: true, isBanned: true },
    })
    results.aiUsers = aiUsers.map(u => ({
      id: u.id, username: u.username, aiPaused: u.aiPaused, aiPersonality: u.aiPersonality,
      aiResponseDelay: u.aiResponseDelay, isBanned: u.isBanned,
    }))

    // 2. Check open challenges
    const openChallenges = await prisma.debate.findMany({
      where: { status: 'WAITING', opponentId: null },
      select: { id: true, topic: true, challengeType: true, createdAt: true, challengerId: true },
      take: 10,
    })
    results.openChallenges = openChallenges.map(c => ({
      id: c.id, topic: c.topic, challengeType: c.challengeType,
      createdAt: c.createdAt, ageMinutes: Math.round((Date.now() - c.createdAt.getTime()) / 60000),
    }))

    // 3. Check waiting direct challenges to AI users
    const waitingDirectToAI = await prisma.debate.findMany({
      where: { status: 'WAITING', opponent: { isAI: true } },
      select: { id: true, topic: true, challengeType: true, createdAt: true, opponentId: true },
      take: 10,
    })
    results.waitingDirectToAI = waitingDirectToAI.map(c => ({
      id: c.id, topic: c.topic, challengeType: c.challengeType,
      createdAt: c.createdAt, ageMinutes: Math.round((Date.now() - c.createdAt.getTime()) / 60000),
      opponentId: c.opponentId,
    }))

    // 4. Try auto-accept
    try {
      const { triggerAIAutoAccept } = await import('@/lib/ai/trigger-ai-accept')
      const accepted = await triggerAIAutoAccept()
      results.autoAccept = { accepted }
    } catch (err: any) {
      results.errors.push(`Auto-accept error: ${err.message}`)
    }

    // 5. Try responses for active AI debates
    const activeAIDebates = await prisma.debate.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { challenger: { isAI: true } },
          { opponent: { isAI: true } },
        ],
      },
      select: { id: true, topic: true, currentRound: true, totalRounds: true },
      take: 10,
    })
    results.activeAIDebates = activeAIDebates

    for (const debate of activeAIDebates) {
      try {
        const { triggerAIResponseForDebate } = await import('@/lib/ai/trigger-ai-response')
        const responded = await triggerAIResponseForDebate(debate.id)
        results.responses = results.responses || []
        results.responses.push({ debateId: debate.id, responded })
      } catch (err: any) {
        results.errors.push(`Response error for ${debate.id}: ${err.message}`)
      }
    }

    // 6. Check DeepSeek API key
    try {
      const { getDeepSeekKey } = await import('@/lib/ai/deepseek')
      const key = await getDeepSeekKey()
      results.deepseekKey = key ? `${key.substring(0, 6)}...configured` : 'MISSING'
    } catch (err: any) {
      results.deepseekKey = `ERROR: ${err.message}`
    }

    return NextResponse.json(results)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
