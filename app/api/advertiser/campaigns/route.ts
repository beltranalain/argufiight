import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'
import { put } from '@vercel/blob'
import { validateCampaignDates } from '@/lib/ads/helpers'

// POST /api/advertiser/campaigns - Create new campaign
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

    // Get user's email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Find advertiser by email
    const advertiser = await prisma.advertiser.findUnique({
      where: { contactEmail: user.email },
    })

    if (!advertiser) {
      return NextResponse.json({ error: 'Advertiser account not found' }, { status: 404 })
    }

    if (advertiser.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Advertiser account not approved' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const name = formData.get('name') as string
    const type = formData.get('type') as string
    const category = formData.get('category') as string
    const budget = formData.get('budget') as string
    const startDate = formData.get('startDate') as string
    const endDate = formData.get('endDate') as string
    const destinationUrl = formData.get('destinationUrl') as string
    const ctaText = formData.get('ctaText') as string || 'Learn More'
    const file = formData.get('file') as File | null
    const bannerUrl = formData.get('bannerUrl') as string | null

    // Validation
    if (!name || !type || !category || !budget || !startDate || !endDate || !destinationUrl) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      )
    }

    // Validate dates
    const start = new Date(startDate)
    const end = new Date(endDate)
    const dateValidation = validateCampaignDates(start, end)
    if (!dateValidation.valid) {
      return NextResponse.json(
        { error: dateValidation.error },
        { status: 400 }
      )
    }

    // Handle banner upload
    let finalBannerUrl = ''
    if (file) {
      const blob = await put(`campaigns/${Date.now()}-${file.name}`, file, {
        access: 'public',
      })
      finalBannerUrl = blob.url
    } else if (bannerUrl) {
      finalBannerUrl = bannerUrl
    } else {
      return NextResponse.json(
        { error: 'Banner image is required' },
        { status: 400 }
      )
    }

    // Parse targeting (for creator sponsorships)
    let minELO: number | null = null
    let targetCategories: string[] = []
    let minFollowers: number | null = null
    let maxBudgetPerCreator: number | null = null

    if (type === 'CREATOR_SPONSORSHIP') {
      const minELOStr = formData.get('minELO') as string | null
      if (minELOStr) minELO = parseInt(minELOStr, 10)

      const targetCategoriesStr = formData.get('targetCategories') as string | null
      if (targetCategoriesStr) {
        try {
          targetCategories = JSON.parse(targetCategoriesStr)
        } catch {
          // Ignore parse errors
        }
      }

      const minFollowersStr = formData.get('minFollowers') as string | null
      if (minFollowersStr) minFollowers = parseInt(minFollowersStr, 10)

      const maxBudgetStr = formData.get('maxBudgetPerCreator') as string | null
      if (maxBudgetStr) maxBudgetPerCreator = parseFloat(maxBudgetStr)
    }

    // Create campaign
    const campaign = await prisma.campaign.create({
      data: {
        advertiserId: advertiser.id,
        name: name.trim(),
        type: type as any,
        category: category.trim(),
        budget: parseFloat(budget),
        startDate: start,
        endDate: end,
        destinationUrl: destinationUrl.trim(),
        ctaText: ctaText.trim(),
        bannerUrl: finalBannerUrl,
        minELO,
        targetCategories,
        minFollowers,
        maxBudgetPerCreator,
        status: 'PENDING_REVIEW',
      },
    })

    // TODO: Send notification email to admins

    return NextResponse.json({ success: true, campaign }, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create campaign:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create campaign' },
      { status: 500 }
    )
  }
}
