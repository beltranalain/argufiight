import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import { calculateWordCount, updateUserAnalyticsOnStatement } from '@/lib/utils/analytics'

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
      select: {
        id: true,
        topic: true,
        challengerId: true,
        opponentId: true,
        challengeType: true,
        status: true,
        currentRound: true,
        totalRounds: true,
        roundDuration: true,
      },
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

    // Verify user is a participant (for both 2-person and group debates)
    let isParticipant = debate.challengerId === userId || 
                       (debate.opponentId === userId)
    
    // For GROUP challenges (including King of the Hill), check DebateParticipant
    if (!isParticipant && debate.challengeType === 'GROUP') {
      const participant = await prisma.debateParticipant.findFirst({
        where: {
          debateId: id,
          userId: userId,
          status: { in: ['ACTIVE', 'ACCEPTED'] },
        },
      })
      isParticipant = !!participant
    }
    
    if (!isParticipant) {
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

    // Calculate word count
    const wordCount = calculateWordCount(content)
    
    // Create statement
    const statement = await prisma.statement.create({
      data: {
        debateId: id,
        authorId: userId,
        round: debate.currentRound,
        content: content.trim(),
      },
    })

    // Update user analytics (non-blocking)
    updateUserAnalyticsOnStatement(userId, wordCount).catch(err => {
      console.error('Failed to update user analytics:', err)
    })

    // Check if all participants have submitted (for both 2-person and group debates)
    const roundStatements = await prisma.statement.findMany({
      where: {
        debateId: id,
        round: debate.currentRound,
      },
      select: {
        authorId: true,
      },
    })

    const submittedAuthorIds = new Set(roundStatements.map(s => s.authorId))
    
    let allParticipantsSubmitted = false
    if (debate.challengeType === 'GROUP') {
      // For GROUP challenges, check all active participants
      const activeParticipants = await prisma.debateParticipant.findMany({
        where: {
          debateId: id,
          status: { in: ['ACTIVE', 'ACCEPTED'] },
        },
        select: {
          userId: true,
        },
      })

      const activeParticipantIds = new Set(activeParticipants.map(p => p.userId))
      allParticipantsSubmitted = activeParticipantIds.size > 0 && 
        Array.from(activeParticipantIds).every(id => submittedAuthorIds.has(id))
    } else {
      // For 2-person debates, check if both challenger and opponent submitted
      const challengerSubmitted = submittedAuthorIds.has(debate.challengerId)
      const opponentSubmitted = debate.opponentId ? submittedAuthorIds.has(debate.opponentId) : false
      allParticipantsSubmitted = challengerSubmitted && opponentSubmitted
    }

    let updatedDebate = debate

    if (allParticipantsSubmitted) {
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

        // Trigger AI verdict generation automatically (direct function call)
        console.log(`[Debate Complete] Triggering automatic verdict generation for debate ${id}`)
        
        // Import and call the generate function directly (no network calls = more reliable)
        import('@/lib/verdicts/generate-initial').then(async (generateModule) => {
          try {
            console.log(`[Debate Complete] Starting direct verdict generation for debate ${id}`)
            const result = await generateModule.generateInitialVerdicts(id)
            console.log('✅ [Debate Complete] Verdict generation completed successfully:', {
              debateId: id,
              result,
              timestamp: new Date().toISOString(),
            })
          } catch (error: any) {
            console.error('❌ [Debate Complete] Error in direct verdict generation:', {
              debateId: id,
              error: error.message,
              stack: error.stack,
              timestamp: new Date().toISOString(),
            })
          }
        }).catch((importError: any) => {
          console.error('❌ [Debate Complete] Failed to import generate module:', importError.message)
          // Fallback to fetch if import fails (shouldn't happen, but safety net)
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
          }).catch((fetchError: any) => {
            console.error('❌ [Debate Complete] Fallback fetch also failed:', fetchError.message)
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
      // For 2-person debates, notify opponent it's their turn
      // For GROUP debates, all participants can submit simultaneously, so no turn notifications needed
      if (debate.challengeType !== 'GROUP' && debate.opponentId) {
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

