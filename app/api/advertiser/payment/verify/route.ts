import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'
import { createStripeClient } from '@/lib/stripe/stripe-client'
import { calculatePlatformFee } from '@/lib/ads/helpers'
import { Prisma } from '@prisma/client'
import Stripe from 'stripe'

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

    const body = await request.json()
    const { sessionId } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      )
    }

    // Get user email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get advertiser
    const advertiser = await prisma.advertiser.findUnique({
      where: { contactEmail: user.email },
      select: { id: true },
    })

    if (!advertiser) {
      return NextResponse.json(
        { error: 'Advertiser account not found' },
        { status: 404 }
      )
    }

    // Retrieve checkout session from Stripe
    const stripe = await createStripeClient()
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'payment_intent.payment_method'],
    })

    // Check payment status
    // For Checkout Sessions, payment_status can be 'paid' when payment is successful
    if (checkoutSession.payment_status !== 'paid') {
      console.log(`Payment status: ${checkoutSession.payment_status}, session status: ${checkoutSession.status}`)
      return NextResponse.json(
        { 
          error: 'Payment not completed',
          paymentStatus: checkoutSession.payment_status,
          sessionStatus: checkoutSession.status,
        },
        { status: 400 }
      )
    }

    const metadata = checkoutSession.metadata || {}
    const paymentIntent = checkoutSession.payment_intent as Stripe.PaymentIntent

    if (!paymentIntent) {
      return NextResponse.json(
        { error: 'Payment intent not found' },
        { status: 400 }
      )
    }

    // Verify payment intent status - should be 'succeeded' for captured payments
    if (paymentIntent.status !== 'succeeded') {
      console.log(`Payment intent status: ${paymentIntent.status}`)
      // Allow 'processing' status as well, as it may take a moment to finalize
      if (paymentIntent.status !== 'processing') {
        return NextResponse.json(
          { 
            error: 'Payment intent not completed',
            paymentIntentStatus: paymentIntent.status,
          },
          { status: 400 }
        )
      }
    }

    // Handle based on payment type
    if (metadata.type === 'offer_payment' && metadata.offerId) {
      // Create contract from offer
      const offer = await prisma.offer.findUnique({
        where: { id: metadata.offerId },
        include: {
          creator: true,
          campaign: true,
        },
      })

      if (!offer) {
        return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
      }

      if (offer.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'Offer is not pending' },
          { status: 400 }
        )
      }

      // Use baseAmount from metadata (original amount without Stripe fees)
      // Stripe fees are paid by advertiser, so contract uses original amount
      const contractAmount = metadata.baseAmount ? Number(metadata.baseAmount) : Number(offer.amount)

      // Calculate platform fees based on original contract amount
      const { platformFee, creatorPayout } = await calculatePlatformFee(
        offer.creator.creatorStatus,
        contractAmount
      )

      // Create contract
      const contract = await prisma.adContract.create({
        data: {
          offerId: offer.id,
          advertiserId: offer.advertiserId,
          creatorId: offer.creatorId,
          campaignId: offer.campaignId,
          placement: offer.placement,
          totalAmount: new Prisma.Decimal(contractAmount),
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

      return NextResponse.json({
        success: true,
        contract,
        type: 'offer_payment',
      })
    } else if (metadata.type === 'contract_payment' && metadata.contractId) {
      // Update existing contract with payment
      const contract = await prisma.adContract.findUnique({
        where: { id: metadata.contractId },
      })

      if (!contract) {
        return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
      }

      if (contract.escrowHeld) {
        return NextResponse.json(
          { error: 'Payment already processed' },
          { status: 400 }
        )
      }

      await prisma.adContract.update({
        where: { id: contract.id },
        data: {
          escrowHeld: true,
          stripePaymentId: paymentIntent.id,
        },
      })

      return NextResponse.json({
        success: true,
        contract: { ...contract, escrowHeld: true, stripePaymentId: paymentIntent.id },
        type: 'contract_payment',
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid payment type' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Failed to verify advertiser payment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment' },
      { status: 500 }
    )
  }
}

