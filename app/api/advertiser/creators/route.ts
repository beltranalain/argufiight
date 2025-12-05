import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'
import { isCreatorMarketplaceEnabled } from '@/lib/ads/config'

// GET /api/advertiser/creators - Discover creators
export async function GET(request: NextRequest) {
  try {
    const session = await verifySession()
    if (!session) {
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

    const userId = getUserIdFromSession(session)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is an approved advertiser
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const advertiser = await prisma.advertiser.findUnique({
      where: { contactEmail: user.email },
    })

    if (!advertiser || advertiser.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Advertiser account required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const minELO = searchParams.get('minELO')
    const category = searchParams.get('category')
    const minFollowers = searchParams.get('minFollowers')
    const search = searchParams.get('search')

    const where: any = {
      isCreator: true,
    }

    if (minELO) {
      where.eloRating = { gte: parseInt(minELO, 10) }
    }

    if (minFollowers) {
      where.followerCount = { gte: parseInt(minFollowers, 10) }
    }

    if (search) {
      where.username = { contains: search, mode: 'insensitive' }
    }

    const creators = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        eloRating: true,
        creatorStatus: true,
        totalDebates: true,
        debatesWon: true,
        avgMonthlyViews: true,
        avgDebateViews: true,
        followerCount: true,
        profileBannerPrice: true,
        postDebatePrice: true,
        debateWidgetPrice: true,
        profileBannerAvailable: true,
        postDebateAvailable: true,
        debateWidgetAvailable: true,
      },
      orderBy: { eloRating: 'desc' },
      take: 50,
    })

    // Filter by category if provided (would need debate history analysis)
    // For now, return all matching creators

    return NextResponse.json({ creators })
  } catch (error: any) {
    console.error('Failed to fetch creators:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch creators' },
      { status: 500 }
    )
  }
}

