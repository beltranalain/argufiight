import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'
import { createStripeClient, createAdvertiserStripeAccount } from '@/lib/stripe/stripe-client'

// POST /api/advertiser/stripe-connect-embedded - Create embedded Connect onboarding session
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const advertiser = await prisma.advertiser.findUnique({
      where: { contactEmail: user.email },
      select: { id: true, status: true, stripeAccountId: true, companyName: true, contactEmail: true },
    })

    if (!advertiser || advertiser.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Advertiser account required' },
        { status: 403 }
      )
    }

    const stripe = await createStripeClient()
    let stripeAccountId = advertiser.stripeAccountId

    // Create Stripe account if doesn't exist
    if (!stripeAccountId) {
      try {
        stripeAccountId = await createAdvertiserStripeAccount(
          advertiser.id,
          advertiser.contactEmail,
          advertiser.companyName
        )

        await prisma.advertiser.update({
          where: { id: advertiser.id },
          data: { stripeAccountId },
        })
      } catch (accountError: any) {
        console.error('Failed to create Stripe account:', accountError)
        
        if (accountError.message?.includes('Connect') || accountError.code === 'resource_missing') {
          return NextResponse.json(
            { 
              error: 'Stripe Connect is not enabled. Please enable Stripe Connect in your Stripe Dashboard.',
              code: 'CONNECT_NOT_ENABLED',
            },
            { status: 400 }
          )
        }
        
        throw accountError
      }
    }

    // Create Account Session for embedded onboarding
    const accountSession = await stripe.accountSessions.create({
      account: stripeAccountId,
      components: {
        account_onboarding: {
          enabled: true,
          features: {
            external_account_collection: true,
          },
        },
      },
    })

    return NextResponse.json({ 
      client_secret: accountSession.client_secret 
    })
  } catch (error: any) {
    console.error('Failed to create embedded Connect session:', error)
    
    if (error.message?.includes('Connect') || error.code === 'resource_missing') {
      return NextResponse.json(
        { 
          error: 'Stripe Connect is not enabled. Please enable Stripe Connect in your Stripe Dashboard.',
          code: 'CONNECT_NOT_ENABLED',
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to create embedded Connect session' },
      { status: 500 }
    )
  }
}

