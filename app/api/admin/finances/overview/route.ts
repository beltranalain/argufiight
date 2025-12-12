import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'
import { createStripeClient, getStripeKeys } from '@/lib/stripe/stripe-client'
import Stripe from 'stripe'

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAdmin()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check Stripe mode
    const { secretKey } = await getStripeKeys()
    const isTestMode = secretKey?.startsWith('sk_test_') || false

    // Get date range from query params (default to last 30 days)
    const searchParams = request.nextUrl.searchParams
    let startDate: Date
    let endDate = new Date()
    
    if (searchParams.get('startDate') && searchParams.get('endDate')) {
      // Custom date range
      startDate = new Date(searchParams.get('startDate')!)
      endDate = new Date(searchParams.get('endDate')!)
      // Set end date to end of day
      endDate.setHours(23, 59, 59, 999)
    } else {
      // Quick filter (days)
      const days = parseInt(searchParams.get('days') || '30')
      startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      startDate.setHours(0, 0, 0, 0)
    }

    // ===== SUBSCRIPTION REVENUE =====
    const subscriptions = await prisma.userSubscription.findMany({
      where: {
        tier: 'PRO',
        status: 'ACTIVE',
        createdAt: { gte: startDate },
      },
      include: {
        user: {
          select: { email: true, username: true },
        },
      },
    })

    // Get subscription payments from Stripe
    let subscriptionRevenue = 0
    let subscriptionCount = 0
    const subscriptionTransactions: any[] = []

    if (secretKey) {
      try {
        const stripe = await createStripeClient()
        
        // Get all successful invoices for subscriptions
        const invoices = await stripe.invoices.list({
          limit: 100,
          created: { gte: Math.floor(startDate.getTime() / 1000) },
          status: 'paid',
          expand: ['data.subscription'],
        })

        for (const invoice of invoices.data) {
          const subscriptionId = (invoice as any).subscription 
            ? (typeof (invoice as any).subscription === 'string' 
                ? (invoice as any).subscription 
                : ((invoice as any).subscription as any)?.id)
            : null
          
          if (subscriptionId) {
            const amount = invoice.amount_paid / 100 // Convert from cents
            subscriptionRevenue += amount
            subscriptionCount++
            
            // Try to find matching subscription in database
            const subscription = subscriptions.find(
              s => s.stripeSubscriptionId === subscriptionId
            )
            
            // Get customer email from invoice
            const customerEmail = typeof invoice.customer === 'string' 
              ? null 
              : (invoice.customer as any)?.email || invoice.customer_email
            
            subscriptionTransactions.push({
              id: invoice.id,
              type: 'subscription',
              amount,
              stripeFee: (invoice as any).application_fee_amount ? (invoice as any).application_fee_amount / 100 : 0,
              netAmount: amount - ((invoice as any).application_fee_amount ? (invoice as any).application_fee_amount / 100 : 0),
              date: new Date(invoice.created * 1000),
              user: subscription?.user || { email: customerEmail || 'Unknown', username: 'Unknown' },
              subscriptionId: subscriptionId,
            })
          }
        }
      } catch (error) {
        console.error('Error fetching Stripe invoices:', error)
      }
    }

    // ===== ADVERTISEMENT REVENUE =====
    const contracts = await prisma.adContract.findMany({
      where: {
        signedAt: { gte: startDate },
      },
      include: {
        advertiser: {
          select: { companyName: true, contactEmail: true },
        },
        creator: {
          select: { username: true, email: true },
        },
        campaign: {
          select: { name: true },
        },
      },
    })

    let adRevenue = 0
    let platformFees = 0
    let creatorPayouts = 0
    const adTransactions: any[] = []

    for (const contract of contracts) {
      const totalAmount = Number(contract.totalAmount)
      const platformFee = Number(contract.platformFee)
      const creatorPayout = Number(contract.creatorPayout)

      adRevenue += totalAmount
      platformFees += platformFee
      creatorPayouts += creatorPayout

      adTransactions.push({
        id: contract.id,
        type: 'advertisement',
        amount: totalAmount,
        platformFee,
        creatorPayout,
        date: contract.signedAt,
        advertiser: contract.advertiser,
        creator: contract.creator,
        campaign: contract.campaign,
        status: contract.status,
        payoutSent: contract.payoutSent,
      })
    }

    // ===== STRIPE BALANCE =====
    let stripeBalance = 0
    let pendingBalance = 0
    let availableBalance = 0

    if (secretKey) {
      try {
        const stripe = await createStripeClient()
        const balance = await stripe.balance.retrieve()
        
        stripeBalance = balance.available[0]?.amount ? balance.available[0].amount / 100 : 0
        pendingBalance = balance.pending[0]?.amount ? balance.pending[0].amount / 100 : 0
        availableBalance = stripeBalance
      } catch (error) {
        console.error('Error fetching Stripe balance:', error)
      }
    }

    // ===== CALCULATE TOTALS =====
    const totalRevenue = subscriptionRevenue + adRevenue
    const totalFees = platformFees // Platform fees from ads
    const totalPayouts = creatorPayouts
    const netRevenue = totalRevenue - totalPayouts // Revenue minus payouts (platform keeps fees)

    // ===== RECENT TRANSACTIONS =====
    const allTransactions = [
      ...subscriptionTransactions,
      ...adTransactions,
    ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 50)

    return NextResponse.json({
      isTestMode,
      period: {
        startDate,
        endDate,
      },
      revenue: {
        subscriptions: {
          total: subscriptionRevenue,
          count: subscriptionCount,
          transactions: subscriptionTransactions,
        },
        advertisements: {
          total: adRevenue,
          count: contracts.length,
          transactions: adTransactions,
        },
        total: totalRevenue,
      },
      fees: {
        platform: totalFees,
        stripe: 0, // Would need to calculate from Stripe fees
      },
      payouts: {
        creators: totalPayouts,
        count: contracts.filter(c => c.payoutSent).length,
      },
      net: {
        revenue: netRevenue,
        balance: availableBalance,
        pending: pendingBalance,
      },
      transactions: allTransactions,
    })
  } catch (error: any) {
    console.error('Failed to fetch finances overview:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch finances overview' },
      { status: 500 }
    )
  }
}

