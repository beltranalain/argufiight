import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { getUserIdFromSession } from '@/lib/auth/session-utils'

// POST /api/debates/[id]/appeal - Submit an appeal for a verdict
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession()
    const userId = getUserIdFromSession(session)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: debateId } = await params
    const body = await request.json()
    const { reason, verdictIds } = body

    // Validate appeal reason
    if (!reason || typeof reason !== 'string' || reason.trim().length < 50) {
      return NextResponse.json(
        { error: 'Appeal reason is required and must be at least 50 characters' },
        { status: 400 }
      )
    }

    if (reason.trim().length > 1000) {
      return NextResponse.json(
        { error: 'Appeal reason must be less than 1000 characters' },
        { status: 400 }
      )
    }

    // Validate verdict IDs
    if (!verdictIds || !Array.isArray(verdictIds) || verdictIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one judge verdict must be selected for appeal' },
        { status: 400 }
      )
    }

    // Get debate with verdict info
    const debate = await prisma.debate.findUnique({
      where: { id: debateId },
      include: {
        challenger: { select: { id: true, username: true } },
        opponent: { select: { id: true, username: true } },
        verdicts: {
          include: {
            judge: { select: { id: true, name: true } },
          },
        },
      },
    })

    // Verify all verdict IDs belong to this debate
    if (debate) {
      const debateVerdictIds = debate.verdicts.map(v => v.id)
      const invalidVerdicts = verdictIds.filter(id => !debateVerdictIds.includes(id))
      
      if (invalidVerdicts.length > 0) {
        return NextResponse.json(
          { error: 'One or more selected verdicts do not belong to this debate' },
          { status: 400 }
        )
      }
    }

    if (!debate) {
      return NextResponse.json({ error: 'Debate not found' }, { status: 404 })
    }

    // Validation: Debate must be VERDICT_READY
    if (debate.status !== 'VERDICT_READY') {
      return NextResponse.json(
        { error: 'Debate must have a verdict ready to appeal' },
        { status: 400 }
      )
    }

    // Validation: User must be the loser
    if (!debate.winnerId) {
      return NextResponse.json(
        { error: 'No winner determined yet' },
        { status: 400 }
      )
    }

    const isChallenger = debate.challengerId === userId
    const isOpponent = debate.opponentId === userId

    if (!isChallenger && !isOpponent) {
      return NextResponse.json(
        { error: 'Only participants can appeal' },
        { status: 403 }
      )
    }

    const userIsWinner = debate.winnerId === userId
    if (userIsWinner) {
      return NextResponse.json(
        { error: 'Winners cannot appeal verdicts' },
        { status: 400 }
      )
    }

    // Validation: Only one appeal per debate
    if (debate.appealCount > 0) {
      return NextResponse.json(
        { error: 'This debate has already been appealed' },
        { status: 400 }
      )
    }

    // Validation: Must be within 48 hours of verdict
    if (debate.verdictDate) {
      const hoursSinceVerdict = (Date.now() - new Date(debate.verdictDate).getTime()) / (1000 * 60 * 60)
      if (hoursSinceVerdict > 48) {
        return NextResponse.json(
          { error: 'Appeal window has expired (48 hours)' },
          { status: 400 }
        )
      }
    }

    // Store original winner before appeal
    const originalWinnerId = debate.winnerId

    // Update debate with appeal info
    const updatedDebate = await prisma.debate.update({
      where: { id: debateId },
      data: {
        appealedAt: new Date(),
        appealStatus: 'PENDING',
        appealCount: 1,
        appealedBy: userId,
        originalWinnerId,
        appealReason: reason.trim(),
        appealedStatements: JSON.stringify(verdictIds), // Store verdict IDs instead of statement IDs
        status: 'APPEALED',
        winnerId: null, // Temporarily clear winner until new verdict
      },
    })

    // Create notification for opponent
    const opponentId = isChallenger ? debate.opponentId : debate.challengerId
    if (opponentId) {
      await prisma.notification.create({
        data: {
          userId: opponentId,
          type: 'DEBATE_ACCEPTED', // Reuse type, or create new type
          title: 'Verdict Appealed',
          message: `${isChallenger ? debate.challenger.username : debate.opponent?.username} has appealed the verdict. A new verdict will be generated using different judges.`,
          debateId,
        },
      })
    }

    // Create notification for the user who appealed
    await prisma.notification.create({
      data: {
        userId,
        type: 'DEBATE_ACCEPTED',
        title: 'Appeal Submitted',
        message: 'Your appeal has been submitted. A new verdict will be generated shortly. You will be notified when it\'s ready.',
        debateId,
      },
    })

    // Trigger new verdict generation asynchronously
    // Use absolute URL for Vercel - prioritize NEXT_PUBLIC_APP_URL
    let baseUrl = 'http://localhost:3000'
    if (process.env.NEXT_PUBLIC_APP_URL) {
      baseUrl = process.env.NEXT_PUBLIC_APP_URL
    } else if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`
    }
    
    const regenerateUrl = `${baseUrl}/api/verdicts/regenerate`
    
    console.log(`[Appeal] Triggering verdict regeneration for debate ${debateId} via ${regenerateUrl}`)
    
    // Fire-and-forget with comprehensive error logging
    fetch(regenerateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ debateId }),
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(30000), // 30 second timeout
    })
    .then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ [Appeal] Failed to trigger verdict regeneration:', {
          debateId,
          status: response.status,
          statusText: response.statusText,
          error: errorData.error || 'Unknown error',
          details: errorData.details,
          url: regenerateUrl,
          timestamp: new Date().toISOString(),
        })
        
        // Update appeal status to indicate failure (but don't block the response)
        prisma.debate.update({
          where: { id: debateId },
          data: {
            appealStatus: 'PENDING', // Keep as PENDING so it can be manually retried
          },
        }).catch(err => console.error('Failed to update appeal status:', err))
      } else {
        const result = await response.json().catch(() => ({}))
        console.log('✅ [Appeal] Verdict regeneration triggered successfully:', {
          debateId,
          result,
          url: regenerateUrl,
          timestamp: new Date().toISOString(),
        })
      }
    })
    .catch(error => {
      console.error('❌ [Appeal] Error triggering verdict regeneration:', {
        debateId,
        error: error.message,
        errorName: error.name,
        stack: error.stack,
        url: regenerateUrl,
        timestamp: new Date().toISOString(),
      })
      
      // Update appeal status to indicate failure (but don't block the response)
      prisma.debate.update({
        where: { id: debateId },
        data: {
          appealStatus: 'PENDING', // Keep as PENDING so it can be manually retried
        },
      }).catch(err => console.error('Failed to update appeal status:', err))
    })

    return NextResponse.json({
      success: true,
      debate: updatedDebate,
      message: 'Appeal submitted. New verdict will be generated shortly.',
    })
  } catch (error) {
    console.error('Appeal error:', error)
    return NextResponse.json(
      { error: 'Failed to submit appeal' },
      { status: 500 }
    )
  }
}

