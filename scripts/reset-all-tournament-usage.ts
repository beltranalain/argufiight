/**
 * Reset all users' tournament usage to 0
 * This fixes the bug where users who haven't created tournaments are seeing limit messages
 * 
 * Run with: npx tsx scripts/reset-all-tournament-usage.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const FEATURES = {
  TOURNAMENTS: 'tournaments',
}

async function resetAllTournamentUsage() {
  console.log('🔄 Resetting all tournament usage to 0...')

  try {
    const now = new Date()
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    // Get all usage records for tournaments in the current period
    const allUsage = await prisma.usageTracking.findMany({
      where: {
        featureType: FEATURES.TOURNAMENTS,
        periodStart: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    })

    console.log(`Found ${allUsage.length} tournament usage records to reset`)

    // Reset all to 0
    const result = await prisma.usageTracking.updateMany({
      where: {
        featureType: FEATURES.TOURNAMENTS,
        periodStart: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      data: {
        count: 0,
      },
    })

    console.log(`✅ Reset ${result.count} tournament usage records to 0`)
    console.log(`   Period: ${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()}`)

    // Also reset any usage from previous periods (cleanup)
    const oldUsage = await prisma.usageTracking.findMany({
      where: {
        featureType: FEATURES.TOURNAMENTS,
        periodStart: {
          lt: periodStart,
        },
      },
    })

    if (oldUsage.length > 0) {
      const oldResult = await prisma.usageTracking.updateMany({
        where: {
          featureType: FEATURES.TOURNAMENTS,
          periodStart: {
            lt: periodStart,
          },
        },
        data: {
          count: 0,
        },
      })
      console.log(`✅ Also reset ${oldResult.count} old tournament usage records to 0`)
    }

    console.log('\n✅ All tournament usage has been reset to 0 for all users!')
  } catch (error: any) {
    console.error('❌ Error resetting tournament usage:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

resetAllTournamentUsage()

