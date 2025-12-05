import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'
import { isEligibleForCreator, getCreatorStatus } from '@/lib/ads/helpers'
import { isCreatorMarketplaceEnabled } from '@/lib/ads/config'

// POST /api/creators/enable - Enable creator mode
export async function POST(request: NextRequest) {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = getUserIdFromSession(session)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if creator marketplace is enabled
    const marketplaceEnabled = await isCreatorMarketplaceEnabled()
    if (!marketplaceEnabled) {
      return NextResponse.json(
        { error: 'Creator Marketplace is currently disabled' },
        { status: 403 }
      )
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        eloRating: true,
        totalDebates: true,
        createdAt: true,
        isCreator: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.isCreator) {
      return NextResponse.json(
        { error: 'Creator mode already enabled' },
        { status: 400 }
      )
    }

    // Check eligibility
    const eligibility = await isEligibleForCreator(
      user.eloRating,
      user.createdAt,
      user.totalDebates
    )

    if (!eligibility.eligible) {
      return NextResponse.json(
        {
          error: 'Not eligible for creator mode',
          reasons: eligibility.reasons,
        },
        { status: 400 }
      )
    }

    // Determine creator status based on ELO
    const creatorStatus = getCreatorStatus(user.eloRating)

    // Enable creator mode
    await prisma.user.update({
      where: { id: userId },
      data: {
        isCreator: true,
        creatorStatus,
        creatorSince: new Date(),
        // Set default prices
        profileBannerPrice: 300,
        postDebatePrice: 150,
        debateWidgetPrice: 200,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to enable creator mode:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to enable creator mode' },
      { status: 500 }
    )
  }
}

