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
  const params = await searchParams
  const sessionId = params.session_id
  const campaignId = params.campaign_id

  if (!sessionId || !campaignId) {
    redirect('/advertiser/dashboard?error=missing_params')
  }

  try {
    const { secretKey } = await getStripeKeys()
    if (!secretKey) {
      redirect('/advertiser/dashboard?error=stripe_not_configured')
    }

    const stripe = await createStripeClient()
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)

    if (checkoutSession.payment_status !== 'paid') {
      redirect('/advertiser/dashboard?error=payment_not_completed')
    }

    const stripeCampaignId = checkoutSession.metadata?.campaignId
    if (stripeCampaignId !== campaignId) {
      redirect('/advertiser/dashboard?error=campaign_mismatch')
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, advertiserId: true, paymentStatus: true, status: true },
    })

    if (!campaign) {
      redirect('/advertiser/dashboard?error=campaign_not_found')
    }

    if (campaign.paymentStatus === 'PAID') {
      redirect('/advertiser/dashboard?success=already_paid')
    }

    const stripeAdvertiserId = checkoutSession.metadata?.advertiserId
    if (stripeAdvertiserId && campaign.advertiserId !== stripeAdvertiserId) {
      redirect('/advertiser/dashboard?error=advertiser_mismatch')
    }

    const paymentIntentId = checkoutSession.payment_intent as string
    if (!paymentIntentId) {
      redirect('/advertiser/dashboard?error=payment_intent_missing')
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        stripePaymentId: paymentIntentId,
        paidAt: new Date(),
        status: 'PENDING_REVIEW' as any,
        paymentStatus: 'PAID',
      },
    })

    redirect('/advertiser/dashboard?success=payment_completed')
  } catch (error: any) {
    redirect(`/advertiser/dashboard?error=verification_failed&message=${encodeURIComponent(error.message || 'Unknown error')}`)
  }
}
