import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'
import { calculatePlatformFee } from '@/lib/ads/helpers'
import { holdPaymentInEscrow, getOrCreateCustomer } from '@/lib/stripe/stripe-client'

export async function POST(
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

    // Get offer
    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        advertiser: true,
        creator: true,
        campaign: true,
      },
    })

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }

    if (offer.creatorId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (offer.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Offer is not pending' },
        { status: 400 }
      )
    }

    if (new Date(offer.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Offer has expired' },
        { status: 400 }
      )
    }

    // Calculate fees
    const { platformFee, creatorPayout } = await calculatePlatformFee(
      offer.creator.creatorStatus,
      Number(offer.amount)
    )

    // Check if payment is already held (contract might exist from checkout)
    const existingContract = await prisma.adContract.findUnique({
      where: { offerId: offer.id },
    })

    if (existingContract && existingContract.escrowHeld) {
      // Contract already exists with payment held (from checkout)
      // Update offer status
      await prisma.offer.update({
        where: { id: offer.id },
        data: {
          status: 'ACCEPTED',
          respondedAt: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        contract: existingContract,
        message: 'Contract already exists with payment held',
      })
    }

    // Try to hold payment in escrow directly
    // If this fails (no payment method), advertiser will need to use checkout
    try {
      // Get or create Stripe customer for advertiser
      const customerId = await getOrCreateCustomer(
        offer.advertiser.id,
        offer.advertiser.contactEmail
      )

      // Hold payment in escrow
      const paymentIntent = await holdPaymentInEscrow(
        Number(offer.amount),
        customerId,
        `Campaign: ${offer.campaign.name}`
      )

      // Create contract
      const contract = await prisma.adContract.create({
        data: {
          offerId: offer.id,
          advertiserId: offer.advertiserId,
          creatorId: offer.creatorId,
          campaignId: offer.campaignId,
          placement: offer.placement,
          totalAmount: offer.amount,
          platformFee,
          creatorPayout,
          startDate: offer.campaign.startDate,
          endDate: new Date(
            new Date(offer.campaign.startDate).getTime() + offer.duration * 24 * 60 * 60 * 1000
          ),
          status: 'SCHEDULED',
          escrowHeld: true,
          stripePaymentId: paymentIntent.id,
        },
      })

      // Update offer status
      await prisma.offer.update({
        where: { id: offer.id },
        data: {
          status: 'ACCEPTED',
          respondedAt: new Date(),
        },
      })

      return NextResponse.json({ success: true, contract })
    } catch (paymentError: any) {
      // Payment failed - advertiser needs to use checkout
      console.error('Failed to process payment directly:', paymentError)
      return NextResponse.json({
        success: false,
        requiresPayment: true,
        message: 'Advertiser payment required. Please use the checkout portal.',
        checkoutUrl: `/advertiser/checkout?offerId=${offer.id}`,
      }, { status: 402 }) // 402 Payment Required
    }
  } catch (error: any) {
    console.error('Failed to accept offer:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to accept offer' },
      { status: 500 }
    )
  }
}

