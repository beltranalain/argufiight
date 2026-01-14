import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { createStripeClient, getStripeKeys } from '@/lib/stripe/stripe-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  searchParams: Promise<{
    session_id?: string
    campaign_id?: string
  }>
}

export default async function CampaignPaymentSuccessPage({ searchParams }: PageProps) {
  console.log('[Payment Success Page] Page component called')
  
  const params = await searchParams
  const sessionId = params.session_id
  const campaignId = params.campaign_id

  console.log('[Payment Success Page] Received params:', { sessionId, campaignId })

  // Validate required parameters
  if (!sessionId || !campaignId) {
    console.log('[Payment Success Page] Missing parameters, redirecting')
    redirect('/advertiser/dashboard?error=missing_params')
  }

  try {
    // Verify payment with Stripe
    const { secretKey } = await getStripeKeys()
    if (!secretKey) {
      console.error('[Payment Success] Stripe not configured')
      redirect('/advertiser/dashboard?error=stripe_not_configured')
    }

    const stripe = await createStripeClient()

    // Get checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)

    // Verify payment status
    if (checkoutSession.payment_status !== 'paid') {
      console.error('[Payment Success] Payment not completed:', {
        sessionId,
        paymentStatus: checkoutSession.payment_status,
      })
      redirect('/advertiser/dashboard?error=payment_not_completed')
    }

    // Verify campaign ID matches the one in Stripe metadata
    const stripeCampaignId = checkoutSession.metadata?.campaignId
    if (stripeCampaignId !== campaignId) {
      console.error('[Payment Success] Campaign ID mismatch:', {
        stripeCampaignId,
        providedCampaignId: campaignId,
        sessionId,
      })
      redirect('/advertiser/dashboard?error=campaign_mismatch')
    }

    // Get campaign to verify it exists and check if already paid
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        advertiserId: true,
        paymentStatus: true,
        status: true,
      },
    })

    if (!campaign) {
      console.error('[Payment Success] Campaign not found:', campaignId)
      redirect('/advertiser/dashboard?error=campaign_not_found')
    }

    // Check if already paid (idempotency check)
    if (campaign.paymentStatus === 'PAID') {
      console.log('[Payment Success] Campaign already paid, redirecting to dashboard')
      redirect('/advertiser/dashboard?success=already_paid')
    }

    // Verify advertiser ID matches (from Stripe metadata)
    const stripeAdvertiserId = checkoutSession.metadata?.advertiserId
    if (stripeAdvertiserId && campaign.advertiserId !== stripeAdvertiserId) {
      console.error('[Payment Success] Advertiser ID mismatch:', {
        stripeAdvertiserId,
        campaignAdvertiserId: campaign.advertiserId,
        sessionId,
      })
      redirect('/advertiser/dashboard?error=advertiser_mismatch')
    }

    // Get payment intent
    const paymentIntentId = checkoutSession.payment_intent as string
    if (!paymentIntentId) {
      console.error('[Payment Success] Payment intent not found in checkout session:', sessionId)
      redirect('/advertiser/dashboard?error=payment_intent_missing')
    }

    // Update campaign with payment info
    const updateData: any = {
      stripePaymentId: paymentIntentId,
      paidAt: new Date(),
      status: 'PENDING_REVIEW' as any,
      paymentStatus: 'PAID',
    }
    
    await prisma.campaign.update({
      where: { id: campaignId },
      data: updateData,
    })

    console.log('[Payment Success] Payment verified and campaign updated:', {
      campaignId,
      paymentIntentId,
      status: 'PENDING_REVIEW',
      paymentStatus: 'PAID',
    })

    // Redirect to dashboard with success message
    redirect('/advertiser/dashboard?success=payment_completed')
  } catch (error: any) {
    console.error('[Payment Success] Failed to verify payment:', error)
    redirect(`/advertiser/dashboard?error=verification_failed&message=${encodeURIComponent(error.message || 'Unknown error')}`)
  }
}
