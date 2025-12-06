import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'
import { createAdvertiserStripeAccount, createAccountOnboardingLink } from '@/lib/stripe/stripe-client'

// GET /api/advertiser/stripe-onboarding - Get Stripe onboarding link
export async function GET(request: NextRequest) {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = getUserIdFromSession(session)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

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

    let stripeAccountId = advertiser.stripeAccountId

    // Create Stripe account if doesn't exist
    if (!stripeAccountId) {
      stripeAccountId = await createAdvertiserStripeAccount(
        advertiser.id,
        advertiser.contactEmail,
        advertiser.companyName
      )

      // Update advertiser with Stripe account ID
      await prisma.advertiser.update({
        where: { id: advertiser.id },
        data: { stripeAccountId },
      })
    }

    // Generate onboarding link
    const returnUrl = `${process.env.NEXT_PUBLIC_URL || 'https://www.argufight.com'}/advertiser/settings`
    const onboardingUrl = await createAccountOnboardingLink(stripeAccountId, returnUrl)

    return NextResponse.json({ url: onboardingUrl })
  } catch (error: any) {
    console.error('Failed to create Stripe onboarding link:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create onboarding link' },
      { status: 500 }
    )
  }
}

