import { prisma } from '@/lib/db/prisma'

/**
 * Get or create appeal limit for a user
 */
export async function getUserAppealLimit(userId: string) {
  let appealLimit = await prisma.appealLimit.findUnique({
    where: { userId },
  })

  // Create default limit if doesn't exist
  if (!appealLimit) {
    // Get system default (from settings or use 4)
    const defaultLimit = 4 // TODO: Get from admin settings
    
    const resetDate = new Date()
    resetDate.setMonth(resetDate.getMonth() + 1)
    resetDate.setDate(1) // First of next month

    appealLimit = await prisma.appealLimit.create({
      data: {
        userId,
        monthlyLimit: defaultLimit,
        currentCount: 0,
        resetDate,
      },
    })
  }

  // Check if we need to reset (new month)
  const now = new Date()
  if (now >= appealLimit.resetDate) {
    // Reset to new month
    const newResetDate = new Date()
    newResetDate.setMonth(newResetDate.getMonth() + 1)
    newResetDate.setDate(1)

    appealLimit = await prisma.appealLimit.update({
      where: { id: appealLimit.id },
      data: {
        currentCount: 0,
        resetDate: newResetDate,
      },
    })
  }

  return appealLimit
}

/**
 * Check if user can appeal (has remaining appeals)
 */
export async function canUserAppeal(userId: string): Promise<{ canAppeal: boolean; remaining: number; limit: number }> {
  const appealLimit = await getUserAppealLimit(userId)
  
  // Check subscription for additional appeals
  const activeSubscription = await prisma.appealSubscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      OR: [
        { endDate: null },
        { endDate: { gt: new Date() } },
      ],
    },
    orderBy: { createdAt: 'desc' },
  })

  const totalLimit = appealLimit.monthlyLimit + (activeSubscription?.appealsIncluded || 0)
  const remaining = Math.max(0, totalLimit - appealLimit.currentCount)

  return {
    canAppeal: remaining > 0,
    remaining,
    limit: totalLimit,
  }
}

/**
 * Increment appeal count for user
 */
export async function incrementAppealCount(userId: string) {
  const appealLimit = await getUserAppealLimit(userId)
  
  await prisma.appealLimit.update({
    where: { id: appealLimit.id },
    data: {
      currentCount: { increment: 1 },
    },
  })
}

/**
 * Manually adjust appeal count (admin only)
 */
export async function adjustAppealCount(userId: string, adjustment: number) {
  const appealLimit = await getUserAppealLimit(userId)
  
  const newCount = Math.max(0, appealLimit.currentCount + adjustment)
  
  return await prisma.appealLimit.update({
    where: { id: appealLimit.id },
    data: {
      currentCount: newCount,
    },
  })
}

/**
 * Set monthly limit for user (admin only)
 */
export async function setMonthlyLimit(userId: string, limit: number) {
  const appealLimit = await getUserAppealLimit(userId)
  
  return await prisma.appealLimit.update({
    where: { id: appealLimit.id },
    data: {
      monthlyLimit: limit,
    },
  })
}

