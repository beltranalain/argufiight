/**
 * Cron Job: Expire Pending Offers
 * Runs daily at 1 AM to expire offers past their expiration date
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyCronAuth } from '@/lib/auth/cron-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authError = verifyCronAuth(request)
    if (authError) return authError

    const now = new Date()

    const expiredOffers = await prisma.offer.findMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: now },
      },
      include: {
        advertiser: { select: { companyName: true, contactEmail: true } },
        creator: { select: { id: true, username: true, email: true, coins: true } },
        campaign: { select: { name: true } },
      },
    })

    let expiredCount = 0
    const errors: string[] = []

    for (const offer of expiredOffers) {
      try {
        await prisma.offer.update({
          where: { id: offer.id },
          data: { status: 'EXPIRED' },
        })
        expiredCount++

        // Notify both parties
        await prisma.notification.createMany({
          data: [
            {
              userId: offer.advertiserId,
              type: 'OTHER',
              title: 'Offer Expired',
              message: `Your offer to ${offer.creator.username} for "${offer.campaign.name}" has expired`,
            },
            {
              userId: offer.creator.id,
              type: 'OTHER',
              title: 'Offer Expired',
              message: `An offer from ${offer.advertiser.companyName} has expired`,
            },
          ],
        })
      } catch (error: any) {
        errors.push(`Failed to expire offer ${offer.id}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      found: expiredOffers.length,
      expired: expiredCount,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error('[Cron] Offer expiration failed:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to expire offers' },
      { status: 500 }
    )
  }
}
