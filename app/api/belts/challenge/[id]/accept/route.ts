/**
 * API Route: POST /api/belts/challenge/[id]/accept
 * Accept a belt challenge
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifySessionWithDb } from '@/lib/auth/session-verify'
import { acceptBeltChallenge } from '@/lib/belts/core'
import { prisma } from '@/lib/db/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySessionWithDb()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Temporarily enable belt system for challenge operations
    const originalFlag = process.env.ENABLE_BELT_SYSTEM
    if (originalFlag !== 'true') {
      process.env.ENABLE_BELT_SYSTEM = 'true'
    }

    const { id } = await params

    const challenge = await prisma.beltChallenge.findUnique({
      where: { id },
      include: {
        belt: true,
      },
    })

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    // Verify user is the belt holder
    if (challenge.beltHolderId !== session.userId) {
      return NextResponse.json(
        { error: 'You are not the belt holder' },
        { status: 403 }
      )
    }

    let result
    try {
      result = await acceptBeltChallenge(id)
    } finally {
      // Restore original flag value
      if (originalFlag !== 'true') {
        process.env.ENABLE_BELT_SYSTEM = originalFlag || ''
      }
    }

    return NextResponse.json({
      challenge: result.challenge,
      debate: result.debate,
      message: 'Challenge accepted. Debate created successfully.',
    })
  } catch (error: any) {
    console.error('[API /belts/challenge/[id]/accept] Error accepting challenge:', error)
    console.error('[API /belts/challenge/[id]/accept] Error stack:', error.stack)
    const errorMessage = error?.message || error?.toString() || 'Failed to accept challenge'
    return NextResponse.json(
      { error: errorMessage },
      { status: error?.statusCode || 500 }
    )
  }
}
