import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'

// POST /api/advertiser/offers - Create a new offer to a creator
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

    // Verify advertiser is approved
    if (advertiser.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Advertiser account must be approved to make offers' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      creatorId,
      campaignId,
      placement,
      duration,
      paymentType,
      amount,
      cpcRate,
      cpmRate,
      message,
      expiresInDays = 7, // Default 7 days to accept
    } = body

    // Validate required fields
    if (!creatorId || !campaignId || !placement || !duration || !paymentType || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: creatorId, campaignId, placement, duration, paymentType, amount' },
        { status: 400 }
      )
    }

    // Verify campaign belongs to this advertiser
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (campaign.advertiserId !== advertiser.id) {
      return NextResponse.json({ error: 'Campaign does not belong to this advertiser' }, { status: 403 })
    }

    // Verify campaign is approved
    if (campaign.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Campaign must be approved to make offers' },
        { status: 400 }
      )
    }

    // Verify creator exists and is a creator
    const creator = await prisma.user.findUnique({
      where: { id: creatorId },
      select: { isCreator: true },
    })

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    if (!creator.isCreator) {
      return NextResponse.json({ error: 'User is not a creator' }, { status: 400 })
    }

    // Calculate expiration date
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiresInDays)

    // Create the offer
    const offer = await prisma.offer.create({
      data: {
        advertiserId: advertiser.id,
        campaignId: campaign.id,
        creatorId: creatorId,
        placement,
        duration,
        paymentType,
        amount: amount,
        cpcRate: cpcRate ? cpcRate : null,
        cpmRate: cpmRate ? cpmRate : null,
        message: message || null,
        expiresAt,
        status: 'PENDING',
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // TODO: Send notification to creator

    return NextResponse.json({ success: true, offer })
  } catch (error: any) {
    console.error('Failed to create offer:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create offer' },
      { status: 500 }
    )
  }
}

