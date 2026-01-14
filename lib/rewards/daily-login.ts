import { prisma } from '@/lib/db/prisma'

interface DailyLoginRewardSettings {
  baseReward: number
  streakMultiplier: number
  monthlyMultiplierCap: number
}

const DEFAULT_SETTINGS: DailyLoginRewardSettings = {
  baseReward: 10,
  streakMultiplier: 0.1, // 10% increase per month
  monthlyMultiplierCap: 3.0, // Max 3x multiplier
}

/**
 * Get daily login reward settings from AdminSetting or use defaults
 */
async function getRewardSettings(): Promise<DailyLoginRewardSettings> {
  try {
    const baseRewardSetting = await prisma.adminSetting.findUnique({
      where: { key: 'DAILY_LOGIN_BASE_REWARD' },
    })
    const multiplierSetting = await prisma.adminSetting.findUnique({
      where: { key: 'DAILY_LOGIN_STREAK_MULTIPLIER' },
    })
    const capSetting = await prisma.adminSetting.findUnique({
      where: { key: 'DAILY_LOGIN_MONTHLY_CAP' },
    })

    return {
      baseReward: baseRewardSetting ? parseInt(baseRewardSetting.value) : DEFAULT_SETTINGS.baseReward,
      streakMultiplier: multiplierSetting ? parseFloat(multiplierSetting.value) : DEFAULT_SETTINGS.streakMultiplier,
      monthlyMultiplierCap: capSetting ? parseFloat(capSetting.value) : DEFAULT_SETTINGS.monthlyMultiplierCap,
    }
  } catch (error) {
    console.error('Failed to fetch reward settings, using defaults:', error)
    return DEFAULT_SETTINGS
  }
}

/**
 * Calculate daily login reward based on streak
 */
function calculateReward(streak: number, settings: DailyLoginRewardSettings): number {
  const monthlyMultiplier = Math.min(
    1 + (streak / 30) * settings.streakMultiplier,
    settings.monthlyMultiplierCap
  )
  return Math.floor(settings.baseReward * monthlyMultiplier)
}

/**
 * Check and reward daily login for a user
 * Returns the reward amount if rewarded, 0 if already rewarded today, or null on error
 */
export async function checkAndRewardDailyLogin(userId: string): Promise<number | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        coins: true,
        lastLoginDate: true,
        consecutiveLoginDays: true,
        longestLoginStreak: true,
        totalLoginDays: true,
        lastDailyRewardDate: true,
      },
    })

    if (!user) {
      console.error(`[DailyLoginReward] User not found: ${userId}`)
      return null
    }

    // Get current date normalized to start of day (UTC)
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    // Check if already rewarded today
    if (user.lastDailyRewardDate) {
      const lastRewardDate = new Date(user.lastDailyRewardDate)
      lastRewardDate.setUTCHours(0, 0, 0, 0)

      if (lastRewardDate.getTime() === today.getTime()) {
        // Already rewarded today
        return 0
      }
    }

    // Calculate streak
    let streak = user.consecutiveLoginDays || 0
    const lastLogin = user.lastLoginDate

    if (!lastLogin) {
      // First login ever
      streak = 1
    } else {
      const lastLoginDate = new Date(lastLogin)
      lastLoginDate.setUTCHours(0, 0, 0, 0)

      const daysSinceLastLogin = Math.floor(
        (today.getTime() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysSinceLastLogin === 0) {
        // Same day, multiple logins - already processed
        return 0
      } else if (daysSinceLastLogin === 1) {
        // Consecutive day - increment streak
        streak += 1
      } else {
        // Streak broken - reset to 1
        streak = 1
      }
    }

    // Get reward settings
    const settings = await getRewardSettings()

    // Calculate reward
    const dailyReward = calculateReward(streak, settings)

    // Update user in a transaction
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Update user
      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          coins: { increment: dailyReward },
          consecutiveLoginDays: streak,
          longestLoginStreak: Math.max(user.longestLoginStreak || 0, streak),
          totalLoginDays: { increment: 1 },
          lastLoginDate: new Date(),
          lastDailyRewardDate: today,
        },
        select: {
          coins: true,
        },
      })

      // Create transaction record
      await tx.coinTransaction.create({
        data: {
          userId,
          type: 'DAILY_LOGIN_REWARD',
          status: 'COMPLETED',
          amount: dailyReward,
          balanceAfter: updated.coins,
          description: `Daily login reward (${streak} day streak)`,
          metadata: {
            streak,
            multiplier: Math.min(1 + (streak / 30) * settings.streakMultiplier, settings.monthlyMultiplierCap),
            baseReward: settings.baseReward,
            date: today.toISOString(),
          },
        },
      })

      return updated
    })

    console.log(`[DailyLoginReward] User ${userId} rewarded ${dailyReward} coins (streak: ${streak} days)`)

    // Check for milestone bonuses (optional - can be implemented later)
    // await awardMilestoneBonus(userId, streak)

    return dailyReward
  } catch (error) {
    console.error(`[DailyLoginReward] Error rewarding user ${userId}:`, error)
    return null
  }
}

/**
 * Award milestone bonus for reaching streak milestones
 * Optional feature - can be enabled later
 */
async function awardMilestoneBonus(userId: string, streak: number): Promise<void> {
  const milestones = [7, 30, 60, 100, 365]
  if (!milestones.includes(streak)) {
    return
  }

  const milestoneRewards: Record<number, number> = {
    7: 50,
    30: 200,
    60: 500,
    100: 1000,
    365: 5000,
  }

  const bonusAmount = milestoneRewards[streak]
  if (!bonusAmount) {
    return
  }

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { coins: true },
      })

      if (!user) return

      await tx.user.update({
        where: { id: userId },
        data: {
          coins: { increment: bonusAmount },
        },
      })

      await tx.coinTransaction.create({
        data: {
          userId,
          type: 'STREAK_BONUS',
          status: 'COMPLETED',
          amount: bonusAmount,
          balanceAfter: user.coins + bonusAmount,
          description: `${streak}-day streak milestone bonus`,
          metadata: {
            streak,
            milestone: streak,
          },
        },
      })
    })

    console.log(`[DailyLoginReward] Milestone bonus awarded: ${bonusAmount} coins for ${streak}-day streak`)
  } catch (error) {
    console.error(`[DailyLoginReward] Error awarding milestone bonus:`, error)
  }
}
