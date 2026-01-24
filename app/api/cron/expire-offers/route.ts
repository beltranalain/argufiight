/**
 * Cron Job: Expire Pending Offers
 * Runs daily at 1 AM to expire offers past their expiration date
 *
 * Schedule: 0 1 * * * (daily at 1 AM)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('[Cron] Starting offer expiration check...')

    const now = new Date()

    // Find expired pending offers
    const expiredOffers = await prisma.offer.findMany({
      where: {
        status: 'PENDING',
        expiresAt: {
          lt: now,
        },
      },
      include: {
        advertiser: {
          select: { companyName: true, contactEmail: true },
        },
        creator: {
          select: { id: true, username: true, email: true, coins: true },
        },
        campaign: {
          select: { name: true },
        },
      },
    })

    console.log(`[Cron] Found ${expiredOffers.length} expired offers`)

    let expiredCount = 0
    let refundedCount = 0
    const errors: string[] = []

    // Process each expired offer
    for (const offer of expiredOffers) {
      try {
        // Update offer status to EXPIRED
        await prisma.offer.update({
          where: { id: offer.id },
          data: { status: 'EXPIRED' },
        })

        expiredCount++
        console.log(`[Cron] Expired offer ${offer.id} (${offer.advertiser.companyName} → ${offer.creator.username})`)

        // Refund coins if payment was made upfront
        if (offer.paidUpfront && offer.totalAmount) {
          const refundAmount = Math.round(Number(offer.totalAmount))

          await prisma.user.update({
            where: { id: offer.creator.id },
            data: {
              coins: {
                increment: refundAmount,
              },
            },
          })

          // Create coin transaction record
          await prisma.coinTransaction.create({
            data: {
              userId: offer.creator.id,
              type: 'REFUND',
              amount: refundAmount,
              balanceAfter: offer.creator.coins + refundAmount,
              description: `Refund for expired offer from ${offer.advertiser.companyName}`,
              metadata: {
                offerId: offer.id,
                campaignId: offer.campaignId,
                advertiserId: offer.advertiserId,
                reason: 'Offer expired before acceptance',
              },
            },
          })

          refundedCount++
          console.log(`[Cron] Refunded ${refundAmount} coins to ${offer.creator.username}`)
        }

        // Send notification to advertiser
        await prisma.notification.create({
          data: {
            userId: offer.advertiserId,
            type: 'OTHER',
            title: 'Offer Expired',
            message: `Your offer to ${offer.creator.username} for "${offer.campaign.name}" has expired`,
          },
        })

        // Send notification to creator
        await prisma.notification.create({
          data: {
            userId: offer.creator.id,
            type: 'OTHER',
            title: 'Offer Expired',
            message: `An offer from ${offer.advertiser.companyName} has expired${offer.paidUpfront ? ' (coins refunded)' : ''}`,
          },
        })

      } catch (error: any) {
        const errorMsg = `Failed to expire offer ${offer.id}: ${error.message}`
        console.error(`[Cron] ${errorMsg}`)
        errors.push(errorMsg)
      }
    }

    const summary = {
      success: true,
      timestamp: now.toISOString(),
      found: expiredOffers.length,
      expired: expiredCount,
      refunded: refundedCount,
      errors: errors.length > 0 ? errors : undefined,
    }

    console.log('[Cron] Offer expiration complete:', summary)

    return NextResponse.json(summary)

  } catch (error: any) {
    console.error('[Cron] Offer expiration failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to expire offers',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
