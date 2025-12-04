import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { getUserIdFromSession } from '@/lib/auth/session-utils'

// POST /api/debates/[id]/submit - Submit argument
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { content } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    const debate = await prisma.debate.findUnique({
      where: { id },
    })

    if (!debate) {
      return NextResponse.json(
        { error: 'Debate not found' },
        { status: 404 }
      )
    }

    if (debate.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Debate is not active' },
        { status: 400 }
      )
    }

    const userId = getUserIdFromSession(session)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is a participant
    if (debate.challengerId !== userId && debate.opponentId !== userId) {
      return NextResponse.json(
        { error: 'You are not a participant in this debate' },
        { status: 403 }
      )
    }

    // Check if user already submitted for this round
    const existingStatement = await prisma.statement.findFirst({
      where: {
        debateId: id,
        authorId: userId,
        round: debate.currentRound,
      }
    })

    if (existingStatement) {
      return NextResponse.json(
        { error: 'You have already submitted for this round' },
        { status: 400 }
      )
    }

    // Create statement
    const statement = await prisma.statement.create({
      data: {
        debateId: id,
        authorId: userId,
        round: debate.currentRound,
        content: content.trim(),
      },
    })

    // Check if both participants have submitted
    const roundStatements = await prisma.statement.count({
      where: {
        debateId: id,
        round: debate.currentRound,
      },
    })

    let updatedDebate = debate

    if (roundStatements === 2) {
      // Both submitted, advance round
      if (debate.currentRound >= debate.totalRounds) {
        // Debate complete
        updatedDebate = await prisma.debate.update({
          where: { id },
          data: {
            status: 'COMPLETED',
            endedAt: new Date(),
          },
        })

        // Trigger AI verdict generation (async, don't wait)
        // Use absolute URL for Vercel - prioritize NEXT_PUBLIC_APP_URL
        let baseUrl = 'http://localhost:3000'
        if (process.env.NEXT_PUBLIC_APP_URL) {
          baseUrl = process.env.NEXT_PUBLIC_APP_URL
        } else if (process.env.VERCEL_URL) {
          baseUrl = `https://${process.env.VERCEL_URL}`
        }
        
        fetch(`${baseUrl}/api/verdicts/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ debateId: id }),
        })
        .then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error('❌ Failed to trigger verdict generation:', {
              debateId: id,
              status: response.status,
              error: errorData.error || 'Unknown error',
              details: errorData.details,
              url: `${baseUrl}/api/verdicts/generate`
            })
          } else {
            const result = await response.json().catch(() => ({}))
            console.log('✅ Verdict generation triggered successfully for debate:', id, result)
          }
        })
        .catch((error) => {
          console.error('❌ Error triggering verdict generation:', {
            debateId: id,
            error: error.message,
            stack: error.stack,
            url: `${baseUrl}/api/verdicts/generate`
          })
        })
      } else {
        // Advance to next round
        const now = new Date()
        const newDeadline = new Date(now.getTime() + debate.roundDuration)

        updatedDebate = await prisma.debate.update({
          where: { id },
          data: {
            currentRound: debate.currentRound + 1,
            roundDeadline: newDeadline,
          },
        })
      }
    } else {
      // Notify opponent it's their turn
      const opponentId =
        userId === debate.challengerId
          ? debate.opponentId
          : debate.challengerId

      if (opponentId) {
        await prisma.notification.create({
          data: {
            userId: opponentId,
            type: 'DEBATE_TURN',
            title: 'Your Turn to Argue',
            message: `It's your turn in "${debate.topic}"`,
            debateId: debate.id,
          },
        })
      }
    }

    return NextResponse.json({
      statement,
      debate: updatedDebate,
    })
  } catch (error) {
    console.error('Failed to submit argument:', error)
    return NextResponse.json(
      { error: 'Failed to submit argument' },
      { status: 500 }
    )
  }
}

