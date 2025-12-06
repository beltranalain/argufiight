import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { isPlatformAdsEnabled, isCreatorMarketplaceEnabled } from '@/lib/ads/config'

// GET /api/ads/select?placement=PROFILE_BANNER&userId=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const placement = searchParams.get('placement') as string
    const userId = searchParams.get('userId')
    const debateId = searchParams.get('debateId')

    if (!placement) {
      return NextResponse.json({ error: 'Placement is required' }, { status: 400 })
    }

    const now = new Date()

    // Check if ads are enabled
    const [platformEnabled, marketplaceEnabled] = await Promise.all([
      isPlatformAdsEnabled(),
      isCreatorMarketplaceEnabled(),
    ])

    if (!platformEnabled && !marketplaceEnabled) {
      return NextResponse.json({ ad: null }) // No ads enabled
    }

    // Priority: Creator contracts > Platform ads
    // First, try to find an active creator contract for this placement
    if (marketplaceEnabled && userId) {
      const creatorContract = await prisma.adContract.findFirst({
        where: {
          status: 'ACTIVE',
          placement: placement as any,
          startDate: { lte: now },
          endDate: { gte: now },
          creator: {
            id: userId,
            profileBannerAvailable: placement === 'PROFILE_BANNER' ? true : undefined,
            postDebateAvailable: placement === 'POST_DEBATE' ? true : undefined,
            debateWidgetAvailable: placement === 'DEBATE_WIDGET' ? true : undefined,
          },
        },
        include: {
          campaign: {
            select: {
              id: true,
              bannerUrl: true,
              destinationUrl: true,
              ctaText: true,
            },
          },
        },
        orderBy: { signedAt: 'desc' }, // Most recent first
      })

      if (creatorContract) {
        return NextResponse.json({
          ad: {
            id: creatorContract.id,
            bannerUrl: creatorContract.campaign.bannerUrl || '',
            destinationUrl: creatorContract.campaign.destinationUrl,
            ctaText: creatorContract.campaign.ctaText,
            contractId: creatorContract.id,
            campaignId: creatorContract.campaignId,
          },
        })
      }
    }

    // Fallback to platform ads
    if (platformEnabled) {
      const platformCampaign = await prisma.campaign.findFirst({
        where: {
          type: 'PLATFORM_ADS',
          status: 'ACTIVE',
          startDate: { lte: now },
          endDate: { gte: now },
          // Add targeting logic here if needed (minELO, categories, etc.)
        },
        orderBy: { createdAt: 'desc' },
      })

      if (platformCampaign && platformCampaign.bannerUrl) {
        return NextResponse.json({
          ad: {
            id: platformCampaign.id,
            bannerUrl: platformCampaign.bannerUrl,
            destinationUrl: platformCampaign.destinationUrl,
            ctaText: platformCampaign.ctaText,
            contractId: '', // No contract for platform ads
            campaignId: platformCampaign.id,
          },
        })
      }
    }

    // No ad available
    return NextResponse.json({ ad: null })
  } catch (error: any) {
    console.error('Failed to select ad:', error)
    return NextResponse.json({ ad: null }) // Fail silently, don't break the page
  }
}

