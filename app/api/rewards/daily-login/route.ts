import { NextRequest, NextResponse } from 'next/server'
import { verifySessionWithDb } from '@/lib/auth/session-verify'
import { checkAndRewardDailyLogin } from '@/lib/rewards/daily-login'

/**
 * POST /api/rewards/daily-login
 * Check and reward daily login for the authenticated user
 */
export async function POST(req: NextRequest) {
  try {
    const session = await verifySessionWithDb()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const rewardAmount = await checkAndRewardDailyLogin(session.userId)

    if (rewardAmount === null) {
      return NextResponse.json(
        { error: 'Failed to process daily login reward' },
        { status: 500 }
      )
    }

    // Get updated user info for streak
    const { prisma } = await import('@/lib/db/prisma')
    const updatedUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        username: true,
      },
    })

    if (rewardAmount === 0) {
      return NextResponse.json({
        success: true,
        rewarded: false,
        message: 'Already rewarded today',
        rewardAmount: 0,
        streak: updatedUser?.consecutiveLoginDays || 0,
        longestStreak: updatedUser?.longestLoginStreak || 0,
        totalLoginDays: updatedUser?.totalLoginDays || 0,
      })
    }

    return NextResponse.json({
      success: true,
      rewarded: true,
      message: `You earned ${rewardAmount} coins!`,
      rewardAmount,
      streak: updatedUser?.consecutiveLoginDays || 0,
      longestStreak: updatedUser?.longestLoginStreak || 0,
      totalLoginDays: updatedUser?.totalLoginDays || 0,
    })
  } catch (error) {
    console.error('[DailyLoginReward API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/rewards/daily-login
 * Check if user has been rewarded today (without rewarding)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await verifySessionWithDb()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { prisma } = await import('@/lib/db/prisma')
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        lastDailyRewardDate: true,
        consecutiveLoginDays: true,
        longestLoginStreak: true,
        totalLoginDays: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const rewardedToday = user.lastDailyRewardDate
      ? new Date(user.lastDailyRewardDate).setUTCHours(0, 0, 0, 0) === today.getTime()
      : false

    return NextResponse.json({
      rewardedToday,
      streak: user.consecutiveLoginDays || 0,
      longestStreak: user.longestLoginStreak || 0,
      totalLoginDays: user.totalLoginDays || 0,
    })
  } catch (error) {
    console.error('[DailyLoginReward API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
