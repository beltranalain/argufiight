import { NextRequest, NextResponse } from 'next/server'
import { getStripeKeys } from '@/lib/stripe/stripe-client'

/**
 * Public endpoint to get Stripe publishable key
 * This is safe to expose as publishable keys are meant for client-side use
 */
export async function GET(request: NextRequest) {
  try {
    const { publishableKey } = await getStripeKeys()

    if (!publishableKey) {
      return NextResponse.json(
        { error: 'Stripe publishable key not configured' },
        { status: 404 }
      )
    }

    return NextResponse.json({ publishableKey })
  } catch (error: any) {
    console.error('Failed to get Stripe publishable key:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get Stripe publishable key' },
      { status: 500 }
    )
  }
}

