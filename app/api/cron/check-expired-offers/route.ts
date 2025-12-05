import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

/**
 * Cron job to mark expired offers as EXPIRED
 * Should be called by Vercel Cron or external scheduler
 * 
 * Expected cron schedule: Every hour
 * vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/check-expired-offers",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const expiredOffers = await prisma.offer.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: now },
      },
      data: {
        status: 'EXPIRED',
      },
    })

    console.log(`Marked ${expiredOffers.count} offers as expired`)

    return NextResponse.json({
      success: true,
      expiredCount: expiredOffers.count,
    })
  } catch (error: any) {
    console.error('Cron job failed:', error)
    return NextResponse.json(
      { error: error.message || 'Cron job failed' },
      { status: 500 }
    )
  }
}

