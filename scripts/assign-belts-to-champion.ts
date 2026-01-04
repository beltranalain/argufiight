/**
 * Assign 5 belts to belt_champion for testing
 * Run: npx tsx scripts/assign-belts-to-champion.ts
 */

import { PrismaClient } from '@prisma/client'
import { createBelt } from '@/lib/belts'

const prisma = new PrismaClient()

async function main() {
  console.log('\n🏆 Assigning 5 belts to belt_champion...\n')

  try {
    // Check if belt system is enabled
    if (process.env.ENABLE_BELT_SYSTEM !== 'true') {
      console.error('❌ ERROR: ENABLE_BELT_SYSTEM is not set to "true"')
      process.exit(1)
    }

    // Find belt_champion user
    const user = await prisma.user.findUnique({
      where: { email: 'champion@test.com' },
    })

    if (!user) {
      console.error('❌ User belt_champion not found')
      process.exit(1)
    }

    console.log(`✅ Found user: ${user.username} (ID: ${user.id})\n`)

    // Categories for belts
    const categories = ['SPORTS', 'POLITICS', 'TECH', 'ENTERTAINMENT', 'SCIENCE']
    const beltNames = [
      'SPORTS Championship Belt',
      'POLITICS Championship Belt',
      'TECH Championship Belt',
      'ENTERTAINMENT Championship Belt',
      'SCIENCE Championship Belt',
    ]

    // Create 5 belts and assign them to the user
    for (let i = 0; i < 5; i++) {
      try {
        // Check if belt already exists
        const existingBelt = await prisma.belt.findFirst({
          where: {
            name: beltNames[i],
            currentHolderId: user.id,
          },
        })

        if (existingBelt) {
          console.log(`  ✓ Belt "${beltNames[i]}" already assigned to ${user.username}`)
          continue
        }

        // Create new belt
        const belt = await createBelt({
          name: beltNames[i],
          type: 'CATEGORY',
          category: categories[i],
          createdBy: user.id,
        })

        // Assign belt to user
        const acquiredAt = new Date()
        acquiredAt.setDate(acquiredAt.getDate() - (i + 1) * 5) // Different dates for variety
        const gracePeriodEnds = new Date(acquiredAt)
        gracePeriodEnds.setDate(gracePeriodEnds.getDate() + 30)

        await prisma.belt.update({
          where: { id: belt.id },
          data: {
            currentHolderId: user.id,
            status: i === 0 ? 'GRACE_PERIOD' : 'ACTIVE', // First belt in grace period
            acquiredAt,
            gracePeriodEnds: i === 0 ? gracePeriodEnds : null,
            isFirstHolder: i === 0,
            lastDefendedAt: acquiredAt,
            timesDefended: i,
            successfulDefenses: i,
          },
        })

        // Update user belt count
        await prisma.user.update({
          where: { id: user.id },
          data: {
            currentBeltsCount: {
              increment: 1,
            },
          },
        })

        // Create belt history entry
        await prisma.beltHistory.create({
          data: {
            beltId: belt.id,
            toUserId: user.id,
            reason: 'CHALLENGE_WIN',
            daysHeld: (i + 1) * 5,
            defensesWon: i,
            defensesLost: 0,
          },
        })

        console.log(`  ✅ Created and assigned "${beltNames[i]}" to ${user.username}`)
      } catch (error: any) {
        console.error(`  ❌ Failed to create belt "${beltNames[i]}":`, error.message)
      }
    }

    // Verify final count
    const finalUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { username: true, currentBeltsCount: true },
    })

    const actualBelts = await prisma.belt.count({
      where: { currentHolderId: user.id },
    })

    console.log('\n' + '='.repeat(50))
    console.log('\n✨ Summary:\n')
    console.log(`   User: ${finalUser?.username}`)
    console.log(`   Belt Count (cached): ${finalUser?.currentBeltsCount}`)
    console.log(`   Actual Belts in DB: ${actualBelts}`)
    console.log('\n✅ Done! Refresh the page to see the belts.\n')
  } catch (error) {
    console.error('\n❌ Error:', error)
    throw error
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
