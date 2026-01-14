import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/ads/in-feed
 * Get active IN_FEED ads for display on debate pages
 */
export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    
    console.log('[API /ads/in-feed] Fetching IN_FEED ads, current time:', now.toISOString())
    
    const ads = await prisma.advertisement.findMany({
      where: {
        status: 'ACTIVE',
        type: 'IN_FEED',
        creativeUrl: { not: null }, // Must have an image
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: { gte: now } },
          { startDate: null, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: null },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    console.log('[API /ads/in-feed] Found', ads.length, 'active IN_FEED ads')
    ads.forEach(ad => {
      console.log('[API /ads/in-feed] Ad:', {
        id: ad.id,
        title: ad.title,
        status: ad.status,
        type: ad.type,
        hasCreativeUrl: !!ad.creativeUrl,
      })
    })

    return NextResponse.json({ ads })
  } catch (error: any) {
    console.error('[API /ads/in-feed] Failed to fetch IN_FEED ads:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch ads', ads: [] },
      { status: 500 }
    )
  }
}
