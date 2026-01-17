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

    if (rewardAmount === 0) {
      return NextResponse.json({
        success: true,
        rewarded: false,
        message: 'Already rewarded today',
        rewardAmount: 0,
        streak: 0,
        longestStreak: 0,
        totalLoginDays: 0,
      })
    }

    return NextResponse.json({
      success: true,
      rewarded: true,
      message: `You earned ${rewardAmount} coins!`,
      rewardAmount,
      streak: 0,
      longestStreak: 0,
      totalLoginDays: 0,
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

    // Since we don't have the reward tracking fields in the database,
    // we'll return default values for now
    return NextResponse.json({
      rewardedToday: false,
      streak: 0,
      longestStreak: 0,
      totalLoginDays: 0,
    })
  } catch (error) {
    console.error('[DailyLoginReward API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
