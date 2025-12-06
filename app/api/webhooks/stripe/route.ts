import { NextRequest, NextResponse } from 'next/server'
import { createStripeClient, getStripeKeys } from '@/lib/stripe/stripe-client'
import { prisma } from '@/lib/db/prisma'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    const { secretKey } = await getStripeKeys()
    if (!secretKey) {
      return NextResponse.json(
        { error: 'Stripe secret key not configured' },
        { status: 500 }
      )
    }

    const stripe = await createStripeClient()
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || secretKey

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdate(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const subscriptionId = subscription.id

  // Find user by Stripe customer ID
  const userSubscription = await prisma.userSubscription.findUnique({
    where: { stripeCustomerId: customerId },
  })

  if (!userSubscription) {
    console.error(`User subscription not found for customer ${customerId}`)
    return
  }

  // Determine tier from subscription metadata or price
  const tier = subscription.metadata?.tier || 'PRO'
  const billingCycle = subscription.items.data[0]?.price.recurring?.interval?.toUpperCase() || null

  await prisma.userSubscription.update({
    where: { id: userSubscription.id },
    data: {
      tier,
      billingCycle: billingCycle === 'MONTH' ? 'MONTHLY' : billingCycle === 'YEAR' ? 'YEARLY' : null,
      status: subscription.status === 'active' ? 'ACTIVE' : 
              subscription.status === 'canceled' ? 'CANCELLED' :
              subscription.status === 'past_due' ? 'PAST_DUE' : 'EXPIRED',
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      stripeSubscriptionId: subscriptionId,
      stripePriceId: subscription.items.data[0]?.price.id || null,
      cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
    },
  })

  // Update appeal limits based on tier
  if (tier === 'PRO') {
    await prisma.appealLimit.upsert({
      where: { userId: userSubscription.userId },
      create: {
        userId: userSubscription.userId,
        monthlyLimit: 12, // Pro gets 12 appeals/month
        currentCount: 0,
      },
      update: {
        monthlyLimit: 12,
      },
    })
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  const userSubscription = await prisma.userSubscription.findUnique({
    where: { stripeCustomerId: customerId },
  })

  if (!userSubscription) {
    return
  }

  // Downgrade to FREE tier
  await prisma.userSubscription.update({
    where: { id: userSubscription.id },
    data: {
      tier: 'FREE',
      status: 'CANCELLED',
      billingCycle: null,
      cancelledAt: new Date(),
      stripeSubscriptionId: null,
      stripePriceId: null,
    },
  })

  // Reset appeal limits to Free tier (4/month)
  await prisma.appealLimit.upsert({
    where: { userId: userSubscription.userId },
    create: {
      userId: userSubscription.userId,
      monthlyLimit: 4,
      currentCount: 0,
    },
    update: {
      monthlyLimit: 4,
    },
  })
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string
  if (!subscriptionId) return

  const subscription = await prisma.userSubscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  })

  if (subscription) {
    await prisma.userSubscription.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
      },
    })
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string
  if (!subscriptionId) return

  const subscription = await prisma.userSubscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  })

  if (subscription) {
    await prisma.userSubscription.update({
      where: { id: subscription.id },
      data: {
        status: 'PAST_DUE',
      },
    })
  }
}

