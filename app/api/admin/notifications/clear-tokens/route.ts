import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'

// GET /api/admin/notifications/clear-tokens - Get push subscription stats
export async function GET() {
  try {
    const userId = await verifyAdmin()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const totalTokens = await prisma.fCMToken.count()
    const uniqueUsers = await prisma.fCMToken.groupBy({
      by: ['userId'],
    })

    const allTokens = await prisma.fCMToken.findMany({
      select: { token: true, createdAt: true, updatedAt: true },
      take: 200,
    })

    let validSubscriptions = 0
    let invalidTokens = 0
    for (const t of allTokens) {
      try {
        const parsed = JSON.parse(t.token)
        if (parsed.endpoint && parsed.keys?.p256dh && parsed.keys?.auth) {
          validSubscriptions++
        } else {
          invalidTokens++
        }
      } catch {
        invalidTokens++
      }
    }

    return NextResponse.json({
      totalTokens,
      uniqueUsers: uniqueUsers.length,
      sampleSize: allTokens.length,
      validSubscriptions,
      invalidTokens,
    })
  } catch (error: any) {
    console.error('Failed to get push subscription stats:', error)
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 })
  }
}

// DELETE /api/admin/notifications/clear-tokens - Purge all push subscriptions
export async function DELETE() {
  try {
    const userId = await verifyAdmin()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const deleted = await prisma.fCMToken.deleteMany({})

    console.log(`[Admin] Cleared ${deleted.count} push notification subscriptions`)

    return NextResponse.json({
      success: true,
      deletedCount: deleted.count,
      message: `Cleared ${deleted.count} push notification subscription(s). Users will need to reload the page to re-register.`,
    })
  } catch (error: any) {
    console.error('Failed to clear push subscriptions:', error)
    return NextResponse.json({ error: 'Failed to clear push subscriptions' }, { status: 500 })
  }
}
