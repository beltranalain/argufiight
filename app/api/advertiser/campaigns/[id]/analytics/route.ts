import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = getUserIdFromSession(session)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get user's email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Find advertiser
    const advertiser = await prisma.advertiser.findUnique({
      where: { contactEmail: user.email },
      select: { id: true },
    })

    if (!advertiser) {
      return NextResponse.json({ error: 'Advertiser account not found' }, { status: 404 })
    }

    // Get campaign
    const campaign = await prisma.campaign.findUnique({
      where: {
        id,
        advertiserId: advertiser.id,
      },
      include: {
        contracts: {
          include: {
            creator: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        impressions: {
          select: {
            id: true,
            timestamp: true,
          },
          orderBy: {
            timestamp: 'asc',
          },
        },
        clicks: {
          select: {
            id: true,
            timestamp: true,
          },
          orderBy: {
            timestamp: 'asc',
          },
        },
      },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Calculate metrics
    const impressions = campaign.impressions.length
    const clicks = campaign.clicks.length
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0

    // Calculate spent
    // For PLATFORM_ADS: spent is the budget (already paid upfront)
    // For CREATOR_SPONSORSHIP/TOURNAMENT_SPONSORSHIP: spent is sum of contract amounts
    let spent = 0
    if (campaign.type === 'PLATFORM_ADS') {
      // Platform Ads are paid upfront, so spent = budget if payment is complete
      spent = campaign.paymentStatus === 'PAID' ? Number(campaign.budget) : 0
    } else {
      // Creator/Tournament Sponsorship: sum of contract amounts
      spent = campaign.contracts.reduce(
        (sum, contract) => sum + Number(contract.totalAmount),
        0
      )
    }

    const remaining = Number(campaign.budget) - spent

    // Generate time-series data for chart (daily aggregation)
    const startDate = new Date(campaign.startDate)
    const endDate = new Date(campaign.endDate)
    const today = new Date()
    const chartEndDate = endDate > today ? today : endDate
    
    // Create date range
    const dateRange: Date[] = []
    const currentDate = new Date(startDate)
    while (currentDate <= chartEndDate) {
      dateRange.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Aggregate impressions and clicks by date
    const impressionsByDate = new Map<string, number>()
    const clicksByDate = new Map<string, number>()

    campaign.impressions.forEach((impression) => {
      const dateKey = impression.timestamp.toISOString().split('T')[0]
      impressionsByDate.set(dateKey, (impressionsByDate.get(dateKey) || 0) + 1)
    })

    campaign.clicks.forEach((click) => {
      const dateKey = click.timestamp.toISOString().split('T')[0]
      clicksByDate.set(dateKey, (clicksByDate.get(dateKey) || 0) + 1)
    })

    // Build chart data
    const chartData = dateRange.map((date) => {
      const dateKey = date.toISOString().split('T')[0]
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        impressions: impressionsByDate.get(dateKey) || 0,
        clicks: clicksByDate.get(dateKey) || 0,
      }
    })

    const analytics = {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      budget: campaign.budget,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      impressions,
      clicks,
      ctr,
      spent,
      remaining,
      chartData,
      type: campaign.type, // Include campaign type for frontend filtering
      contracts: campaign.contracts.map((contract) => ({
        id: contract.id,
        creator: contract.creator,
        impressionsDelivered: contract.impressionsDelivered,
        clicksDelivered: contract.clicksDelivered,
        status: contract.status,
      })),
    }

    return NextResponse.json({ analytics })
  } catch (error: any) {
    console.error('Failed to fetch campaign analytics:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

