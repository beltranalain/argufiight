/**
 * Reset a user's tournament usage count
 * Usage: npx tsx scripts/reset-tournament-usage.ts [user-id] [count]
 * 
 * Examples:
 *   npx tsx scripts/reset-tournament-usage.ts cec34454-8ca4-416e-9715-0aebee4c7731 1
 *   npx tsx scripts/reset-tournament-usage.ts cec34454-8ca4-416e-9715-0aebee4c7731 0
 */

import { prisma } from '../lib/db/prisma'
import { FEATURES } from '../lib/subscriptions/features'

async function resetTournamentUsage() {
  const userId = process.argv[2]
  const targetCount = process.argv[3] ? parseInt(process.argv[3]) : 1

  if (!userId) {
    console.error('Usage: npx tsx scripts/reset-tournament-usage.ts [user-id] [count]')
    console.error('Example: npx tsx scripts/reset-tournament-usage.ts cec34454-8ca4-416e-9715-0aebee4c7731 1')
    process.exit(1)
  }

  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
    },
  })

  if (!user) {
    console.error(`User ${userId} not found`)
    process.exit(1)
  }

  console.log(`Resetting tournament usage for user: ${user.username} (${user.email})`)
  console.log(`Target count: ${targetCount}`)

  // Get current period
  const now = new Date()
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  // Get current usage
  const currentUsage = await prisma.usageTracking.findUnique({
    where: {
      userId_featureType_periodStart: {
        userId,
        featureType: FEATURES.TOURNAMENTS,
        periodStart,
      },
    },
  })

  console.log(`Current usage: ${currentUsage?.count || 0}`)

  // Update or create usage record
  await prisma.usageTracking.upsert({
    where: {
      userId_featureType_periodStart: {
        userId,
        featureType: FEATURES.TOURNAMENTS,
        periodStart,
      },
    },
    create: {
      userId,
      featureType: FEATURES.TOURNAMENTS,
      count: targetCount,
      periodStart,
      periodEnd,
      periodType: 'MONTHLY',
    },
    update: {
      count: targetCount,
    },
  })

  console.log(`✅ Tournament usage reset to ${targetCount} for user ${user.username}`)
  console.log(`   Period: ${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()}`)
}

resetTournamentUsage()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

