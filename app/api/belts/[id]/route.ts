/**
 * API Route: GET /api/belts/[id]
 * Get a specific belt with full details
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifySessionWithDb } from '@/lib/auth/session-verify'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySessionWithDb()
    if (!session || !session.userId) {
      console.error('[API /belts/[id]] No session or userId')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check feature flag - but allow admin access even if flag is not set
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { isAdmin: true },
    })

    console.log('[API /belts/[id]] User check:', { userId: session.userId, isAdmin: user?.isAdmin, beltSystemEnabled: process.env.ENABLE_BELT_SYSTEM })

    if (process.env.ENABLE_BELT_SYSTEM !== 'true' && !user?.isAdmin) {
      console.error('[API /belts/[id]] Belt system not enabled and user is not admin')
      return NextResponse.json({ error: 'Belt system is not enabled' }, { status: 403 })
    }

    const { id } = await params
    console.log('=== GET /api/belts/[id] ===')
    console.log('Fetching belt ID:', id)
    
    // First, check the raw database value
    const rawCheck = await prisma.$queryRaw<Array<{ design_image_url: string | null }>>`
      SELECT design_image_url FROM belts WHERE id = ${id}
    `
    console.log('Raw SQL check - design_image_url:', rawCheck[0]?.design_image_url)
    
    // Force no caching
    const belt = await prisma.belt.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        type: true,
        category: true,
        status: true,
        currentHolderId: true,
        coinValue: true,
        timesDefended: true,
        successfulDefenses: true,
        lastDefendedAt: true,
        acquiredAt: true,
        isStaked: true,
        designImageUrl: true,
        sponsorName: true,
        sponsorLogoUrl: true,
        currentHolder: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            eloRating: true,
            totalBeltWins: true,
            totalBeltDefenses: true,
          },
        },
        tournament: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        history: {
          take: 10,
          orderBy: {
            transferredAt: 'desc',
          },
          select: {
            id: true,
            reason: true,
            daysHeld: true,
            defensesWon: true,
            defensesLost: true,
            transferredAt: true,
            fromUser: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
            toUser: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
            debate: {
              select: {
                id: true,
                topic: true,
              },
            },
            tournament: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        challenges: {
          where: {
            status: 'PENDING',
          },
          select: {
            id: true,
            status: true,
            entryFee: true,
            coinReward: true,
            expiresAt: true,
            createdAt: true,
            debateTopic: true,
            debateDescription: true,
            debateCategory: true,
            debateChallengerPosition: true,
            debateTotalRounds: true,
            debateSpeedMode: true,
            debateAllowCopyPaste: true,
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
        },
      },
    })

    if (!belt) {
      return NextResponse.json({ error: 'Belt not found' }, { status: 404 })
    }
    
    console.log('Belt fetched from database')
    console.log('Belt designImageUrl from DB:', belt?.designImageUrl)
    console.log('Full belt object:', belt)
    console.log('Belt object keys:', Object.keys(belt || {}))
    console.log('designImageUrl type:', typeof belt?.designImageUrl)
    console.log('designImageUrl value:', belt?.designImageUrl)

    // Force no cache headers
    const response = NextResponse.json({ belt })
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    return response
  } catch (error: any) {
    console.error('[API] Error fetching belt:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch belt' },
      { status: 500 }
    )
  }
}
