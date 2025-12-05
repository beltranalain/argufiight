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
          },
        },
        clicks: {
          select: {
            id: true,
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

    // Calculate spent (sum of contract amounts)
    const spent = campaign.contracts.reduce(
      (sum, contract) => sum + Number(contract.totalAmount),
      0
    )

    const remaining = Number(campaign.budget) - spent

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

