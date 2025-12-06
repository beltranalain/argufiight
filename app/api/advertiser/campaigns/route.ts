import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'
import { put } from '@vercel/blob'
import { validateCampaignDates } from '@/lib/ads/helpers'

/**
 * Get Eastern Timezone offset in minutes for a given date
 */
function getEasternTimezoneOffset(date: Date): number {
  // Create formatters for UTC and Eastern Time
  const utcFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  
  const easternFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  
  // Get UTC and Eastern time strings
  const utcParts = utcFormatter.formatToParts(date)
  const easternParts = easternFormatter.formatToParts(date)
  
  const utcHours = parseInt(utcParts.find(p => p.type === 'hour')?.value || '0')
  const utcMinutes = parseInt(utcParts.find(p => p.type === 'minute')?.value || '0')
  const easternHours = parseInt(easternParts.find(p => p.type === 'hour')?.value || '0')
  const easternMinutes = parseInt(easternParts.find(p => p.type === 'minute')?.value || '0')
  
  const utcTotalMinutes = utcHours * 60 + utcMinutes
  const easternTotalMinutes = easternHours * 60 + easternMinutes
  
  // Calculate offset (Eastern is behind UTC, so offset is negative)
  return easternTotalMinutes - utcTotalMinutes
}

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

    // Parse dates in Eastern Time to prevent timezone shifts
    // Date input returns "YYYY-MM-DD", we need to create dates at midnight Eastern Time
    const startDateStr = startDate.includes('T') ? startDate.split('T')[0] : startDate
    const endDateStr = endDate.includes('T') ? endDate.split('T')[0] : endDate
    
    // Parse date components
    const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number)
    const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number)
    
    // Create dates representing midnight Eastern Time
    // We'll create a temporary date to determine the Eastern Time offset
    const tempStart = new Date(startYear, startMonth - 1, startDay)
    const tempEnd = new Date(endYear, endMonth - 1, endDay)
    
    // Get the Eastern Time offset for these dates (handles DST automatically)
    const startOffset = getEasternTimezoneOffset(tempStart)
    const endOffset = getEasternTimezoneOffset(tempEnd)
    
    // Create dates at midnight UTC, then adjust to Eastern Time
    // Eastern Time is UTC-5 (EST) or UTC-4 (EDT), so we add the offset
    const startFinal = new Date(Date.UTC(startYear, startMonth - 1, startDay, 0, 0, 0))
    const endFinal = new Date(Date.UTC(endYear, endMonth - 1, endDay, 0, 0, 0))
    
    // Adjust to Eastern Time midnight (subtract offset since Eastern is behind UTC)
    const startAdjusted = new Date(startFinal.getTime() - (startOffset * 60 * 1000))
    const endAdjusted = new Date(endFinal.getTime() - (endOffset * 60 * 1000))
    
    const dateValidation = validateCampaignDates(startAdjusted, endAdjusted)
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
        startDate: startAdjusted,
        endDate: endAdjusted,
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
