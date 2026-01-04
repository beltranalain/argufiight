/**
 * API Route: GET /api/belts
 * List all belts with optional filtering
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifySessionWithDb } from '@/lib/auth/session-verify'

export async function GET(request: NextRequest) {
  try {
    const session = await verifySessionWithDb()
    if (!session || !session.userId) {
      console.error('[API /belts] No session or userId')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check feature flag - but allow admin access even if flag is not set
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { isAdmin: true },
    })

    console.log('[API /belts] User check:', { userId: session.userId, isAdmin: user?.isAdmin, beltSystemEnabled: process.env.ENABLE_BELT_SYSTEM })

    if (process.env.ENABLE_BELT_SYSTEM !== 'true' && !user?.isAdmin) {
      console.error('[API /belts] Belt system not enabled and user is not admin')
      return NextResponse.json({ error: 'Belt system is not enabled' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const holderId = searchParams.get('holderId')

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (type) {
      where.type = type
    }

    if (category) {
      where.category = category
    }

    if (holderId) {
      where.currentHolderId = holderId
    }

    const belts = await prisma.belt.findMany({
      where,
      select: {
        id: true,
        name: true,
        type: true,
        category: true,
        status: true,
        designImageUrl: true, // Explicitly include designImageUrl
        coinValue: true,
        creationCost: true,
        acquiredAt: true,
        lastDefendedAt: true,
        timesDefended: true,
        successfulDefenses: true,
        createdAt: true,
        isStaked: true, // Include isStaked so UI can check if belt is challengeable
        currentHolder: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            eloRating: true,
          },
        },
        tournament: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    })

    return NextResponse.json({ belts })
  } catch (error: any) {
    console.error('[API] Error fetching belts:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch belts' },
      { status: 500 }
    )
  }
}
