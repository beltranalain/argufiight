/**
 * API Route: GET /api/belts/challenges
 * Get user's pending belt challenges (as challenger or belt holder)
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifySessionWithDb } from '@/lib/auth/session-verify'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await verifySessionWithDb()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check feature flag
    if (process.env.ENABLE_BELT_SYSTEM !== 'true') {
      return NextResponse.json({ error: 'Belt system is not enabled' }, { status: 403 })
    }

    // Get challenges where user is the challenger
    const challengesMade = await prisma.beltChallenge.findMany({
      where: {
        challengerId: session.userId,
        status: 'PENDING',
      },
      include: {
        belt: {
          select: {
            id: true,
            name: true,
            type: true,
            category: true,
            status: true,
            designImageUrl: true,
            currentHolder: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
        beltHolder: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Get challenges to user's belts (where user is the belt holder)
    const challengesToMyBelts = await prisma.beltChallenge.findMany({
      where: {
        beltHolderId: session.userId,
        status: 'PENDING',
      },
      include: {
        belt: {
          select: {
            id: true,
            name: true,
            type: true,
            category: true,
            status: true,
            designImageUrl: true,
          },
        },
        challenger: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            eloRating: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      challengesMade,
      challengesToMyBelts,
    })
  } catch (error: any) {
    console.error('[API] Error fetching belt challenges:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch belt challenges' },
      { status: 500 }
    )
  }
}
