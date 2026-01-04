/**
 * Create comprehensive test data for the belt system
 * Run: npx tsx scripts/create-belt-test-data.ts
 */

import { PrismaClient } from '@prisma/client'
import { createBelt, createBeltChallenge } from '@/lib/belts'
import { calculateChallengeEntryFee } from '@/lib/belts/coin-economics'

const prisma = new PrismaClient()

// Test users with different ELO ratings
const TEST_USERS = [
  { username: 'belt_champion', email: 'champion@test.com', elo: 1800 },
  { username: 'belt_contender', email: 'contender@test.com', elo: 1600 },
  { username: 'belt_challenger', email: 'challenger@test.com', elo: 1400 },
  { username: 'belt_rookie', email: 'rookie@test.com', elo: 1200 },
  { username: 'belt_veteran', email: 'veteran@test.com', elo: 1500 },
]

// Categories for category belts
const CATEGORIES = ['SPORTS', 'POLITICS', 'TECH', 'ENTERTAINMENT', 'SCIENCE']

async function findOrCreateUser(username: string, email: string, elo: number) {
  let user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: 'test_hash_placeholder', // Not used for testing
        eloRating: elo,
      },
    })
    console.log(`✅ Created user: ${username} (ELO: ${elo})`)
  } else {
    // Update ELO if different
    if (user.eloRating !== elo) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { eloRating: elo },
      })
      console.log(`📝 Updated user: ${username} (ELO: ${elo})`)
    } else {
      console.log(`✓ Found user: ${username} (ELO: ${elo})`)
    }
  }

  return user
}

async function createTestBelts(users: any[]) {
  const belts = []

  // 1. Create CATEGORY belts for different categories
  console.log('\n📦 Creating CATEGORY belts...')
  for (const category of CATEGORIES.slice(0, 3)) {
    // Assign holders to some belts
    const holder = category === 'SPORTS' ? users[0] : category === 'POLITICS' ? users[1] : null

    try {
      const belt = await createBelt({
        name: `${category} Championship Belt`,
        type: 'CATEGORY',
        category,
        createdBy: users[0].id,
      })

      if (holder) {
        // Transfer belt to holder
        const acquiredAt = new Date()
        acquiredAt.setDate(acquiredAt.getDate() - 10) // Held for 10 days
        const gracePeriodEnds = new Date(acquiredAt)
        gracePeriodEnds.setDate(gracePeriodEnds.getDate() + 30)

        await prisma.belt.update({
          where: { id: belt.id },
          data: {
            currentHolderId: holder.id,
            status: 'ACTIVE',
            acquiredAt,
            gracePeriodEnds,
            isFirstHolder: true,
            lastDefendedAt: acquiredAt,
            timesDefended: 0,
          },
        })

        // Update user belt count
        await prisma.user.update({
          where: { id: holder.id },
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
            toUserId: holder.id,
            reason: 'CHALLENGE_WIN',
            daysHeld: 10,
            defensesWon: 0,
            defensesLost: 0,
          },
        })

        console.log(`  ✅ ${category} belt created and assigned to ${holder.username}`)
      } else {
        console.log(`  ✅ ${category} belt created (VACANT)`)
      }

      belts.push({ id: belt.id, category, holder })
    } catch (error: any) {
      console.error(`  ❌ Failed to create ${category} belt:`, error.message)
    }
  }

  // 2. Create a ROOKIE belt (for first-time winners)
  console.log('\n📦 Creating ROOKIE belt...')
  try {
    const rookieBelt = await createBelt({
      name: 'Rookie Champion Belt',
      type: 'ROOKIE',
      createdBy: users[0].id,
    })

    // Assign to rookie user
    const acquiredAt = new Date()
    acquiredAt.setDate(acquiredAt.getDate() - 5) // Held for 5 days
    const gracePeriodEnds = new Date(acquiredAt)
    gracePeriodEnds.setDate(gracePeriodEnds.getDate() + 30)

    await prisma.belt.update({
      where: { id: rookieBelt.id },
      data: {
        currentHolderId: users[3].id, // belt_rookie
        status: 'GRACE_PERIOD',
        acquiredAt,
        gracePeriodEnds,
        isFirstHolder: true,
        lastDefendedAt: acquiredAt,
        timesDefended: 0,
      },
    })

    await prisma.user.update({
      where: { id: users[3].id },
      data: {
        currentBeltsCount: { increment: 1 },
      },
    })

    await prisma.beltHistory.create({
      data: {
        beltId: rookieBelt.id,
        toUserId: users[3].id,
        reason: 'CHALLENGE_WIN',
        daysHeld: 5,
        defensesWon: 0,
        defensesLost: 0,
      },
    })

    console.log(`  ✅ ROOKIE belt created and assigned to ${users[3].username}`)
    belts.push({ id: rookieBelt.id, type: 'ROOKIE', holder: users[3] })
  } catch (error: any) {
    console.error(`  ❌ Failed to create ROOKIE belt:`, error.message)
  }

  // 3. Create an INACTIVE belt (not defended for 30+ days)
  console.log('\n📦 Creating INACTIVE belt...')
  try {
    const inactiveBelt = await createBelt({
      name: 'Inactive Championship Belt',
      type: 'CATEGORY',
      category: 'ENTERTAINMENT',
      createdBy: users[0].id,
    })

    const acquiredAt = new Date()
    acquiredAt.setDate(acquiredAt.getDate() - 35) // Held for 35 days
    const lastDefendedAt = new Date()
    lastDefendedAt.setDate(lastDefendedAt.getDate() - 35) // Not defended for 35 days
    const inactiveAt = new Date()
    inactiveAt.setDate(inactiveAt.getDate() - 5) // Inactive for 5 days

    await prisma.belt.update({
      where: { id: inactiveBelt.id },
      data: {
        currentHolderId: users[1].id, // belt_contender
        status: 'INACTIVE',
        acquiredAt,
        lastDefendedAt,
        inactiveAt,
        timesDefended: 2,
        successfulDefenses: 2,
      },
    })

    await prisma.user.update({
      where: { id: users[1].id },
      data: {
        currentBeltsCount: { increment: 1 },
      },
    })

    await prisma.beltHistory.create({
      data: {
        beltId: inactiveBelt.id,
        toUserId: users[1].id,
        reason: 'CHALLENGE_WIN',
        daysHeld: 35,
        defensesWon: 2,
        defensesLost: 0,
      },
    })

    console.log(`  ✅ INACTIVE belt created (held by ${users[1].username}, not defended for 35 days)`)
    belts.push({ id: inactiveBelt.id, status: 'INACTIVE', holder: users[1] })
  } catch (error: any) {
    console.error(`  ❌ Failed to create INACTIVE belt:`, error.message)
  }

  return belts
}

async function createTestChallenges(belts: any[], users: any[]) {
  console.log('\n⚔️  Creating belt challenges...')

  // Find multiple belts with holders for different challenge scenarios
  // Only ACTIVE belts can be challenged (not GRACE_PERIOD)
  const activeBelts = await prisma.belt.findMany({
    where: {
      currentHolderId: { not: null },
      status: 'ACTIVE', // Only ACTIVE belts can be challenged
      isStaked: false,
    },
    take: 4,
  })

  if (activeBelts.length === 0) {
    console.log('  ⚠️  No active belts found to create challenges')
    return
  }

  // 1. Create a PENDING challenge (using first belt)
  if (activeBelts[0]) {
    const belt1 = activeBelts[0]
    const holder1 = await prisma.user.findUnique({
      where: { id: belt1.currentHolderId! },
    })
    const challenger1 = users.find((u) => u.id !== holder1!.id && Math.abs(u.eloRating - holder1!.eloRating) <= 200) || users[2]
    
    try {
      const entryFee1 = await calculateChallengeEntryFee(belt1.id)
      const challenge1 = await createBeltChallenge(
        belt1.id,
        challenger1.id,
        entryFee1
      )
      console.log(`  ✅ PENDING challenge created: ${challenger1.username} → ${holder1!.username}`)
    } catch (error: any) {
      console.error(`  ❌ Failed to create PENDING challenge:`, error.message)
    }
  }

  // 2. Create an ACCEPTED challenge (using second belt, or create manually if only one belt)
  if (activeBelts[1]) {
    const belt2 = activeBelts[1]
    const holder2 = await prisma.user.findUnique({
      where: { id: belt2.currentHolderId! },
    })
    const challenger2 = users.find((u) => u.id !== holder2!.id && Math.abs(u.eloRating - holder2!.eloRating) <= 200) || users[4]
    
    try {
      const entryFee2 = await calculateChallengeEntryFee(belt2.id)
      const challenge2 = await createBeltChallenge(
        belt2.id,
        challenger2.id,
        entryFee2
      )

      // Manually accept it
      await prisma.beltChallenge.update({
        where: { id: challenge2.id },
        data: {
          status: 'ACCEPTED',
          response: 'ACCEPTED',
          respondedAt: new Date(),
        },
      })

      // Mark belt as staked
      await prisma.belt.update({
        where: { id: belt2.id },
        data: {
          isStaked: true,
          status: 'STAKED',
        },
      })

      console.log(`  ✅ ACCEPTED challenge created: ${challenger2.username} → ${holder2!.username}`)
    } catch (error: any) {
      console.error(`  ❌ Failed to create ACCEPTED challenge:`, error.message)
    }
  }

  // 3. Create a DECLINED challenge (using third belt, or create manually)
  // If we don't have enough ACTIVE belts, create it manually for an existing belt
  if (activeBelts.length >= 3 && activeBelts[2]) {
    const belt3 = activeBelts[2]
    const holder3 = await prisma.user.findUnique({
      where: { id: belt3.currentHolderId! },
    })
    const challenger3 = users.find((u) => u.id !== holder3!.id && Math.abs(u.eloRating - holder3!.eloRating) <= 200) || users[3]
    
    try {
      const entryFee3 = await calculateChallengeEntryFee(belt3.id)
      const challenge3 = await createBeltChallenge(
        belt3.id,
        challenger3.id,
        entryFee3
      )

      // Manually decline it
      await prisma.beltChallenge.update({
        where: { id: challenge3.id },
        data: {
          status: 'DECLINED',
          response: 'DECLINED',
          respondedAt: new Date(),
          declineCount: 1,
        },
      })

      console.log(`  ✅ DECLINED challenge created: ${challenger3.username} → ${holder3!.username}`)
    } catch (error: any) {
      console.error(`  ❌ Failed to create DECLINED challenge:`, error.message)
    }
  } else if (activeBelts.length > 0) {
    // Create DECLINED challenge manually for the first belt (if we have at least one)
    const belt3 = activeBelts[0]
    const holder3 = await prisma.user.findUnique({
      where: { id: belt3.currentHolderId! },
    })
    const challenger3 = users.find((u) => u.id !== holder3!.id && Math.abs(u.eloRating - holder3!.eloRating) <= 200) || users[3]
    
    try {
      const entryFee3 = await calculateChallengeEntryFee(belt3.id)
      const expiredDate = new Date()
      expiredDate.setDate(expiredDate.getDate() + 3) // Expires in 3 days
      
      const challenge3 = await prisma.beltChallenge.create({
        data: {
          beltId: belt3.id,
          challengerId: challenger3.id,
          beltHolderId: belt3.currentHolderId!,
          entryFee: entryFee3,
          coinReward: Math.floor(entryFee3 * 0.6),
          challengerElo: challenger3.eloRating,
          holderElo: holder3!.eloRating,
          eloDifference: Math.abs(challenger3.eloRating - holder3!.eloRating),
          expiresAt: expiredDate,
          status: 'DECLINED',
          response: 'DECLINED',
          respondedAt: new Date(),
          declineCount: 1,
        },
      })

      console.log(`  ✅ DECLINED challenge created (manual): ${challenger3.username} → ${holder3!.username}`)
    } catch (error: any) {
      console.error(`  ❌ Failed to create DECLINED challenge:`, error.message)
    }
  }

  // 4. Create an EXPIRED challenge (using fourth belt, or create manually for first belt)
  if (activeBelts.length >= 4 && activeBelts[3]) {
    const belt4 = activeBelts[3]
    const holder4 = await prisma.user.findUnique({
      where: { id: belt4.currentHolderId! },
    })
    const challenger4 = users.find((u) => u.id !== holder4!.id && Math.abs(u.eloRating - holder4!.eloRating) <= 200) || users[0]
    
    try {
      // Create challenge manually with expired date
      const entryFee4 = await calculateChallengeEntryFee(belt4.id)
      const expiredDate = new Date()
      expiredDate.setDate(expiredDate.getDate() - 1) // Expired yesterday
      
      const challenge4 = await prisma.beltChallenge.create({
        data: {
          beltId: belt4.id,
          challengerId: challenger4.id,
          beltHolderId: belt4.currentHolderId!,
          entryFee: entryFee4,
          coinReward: Math.floor(entryFee4 * 0.6),
          challengerElo: challenger4.eloRating,
          holderElo: holder4!.eloRating,
          eloDifference: Math.abs(challenger4.eloRating - holder4!.eloRating),
          expiresAt: expiredDate,
          status: 'EXPIRED',
        },
      })

      console.log(`  ✅ EXPIRED challenge created: ${challenger4.username} → ${holder4!.username}`)
    } catch (error: any) {
      console.error(`  ❌ Failed to create EXPIRED challenge:`, error.message)
    }
  } else if (activeBelts.length > 0) {
    // Create EXPIRED challenge manually for the first belt
    const belt4 = activeBelts[0]
    const holder4 = await prisma.user.findUnique({
      where: { id: belt4.currentHolderId! },
    })
    const challenger4 = users.find((u) => u.id !== holder4!.id && Math.abs(u.eloRating - holder4!.eloRating) <= 200) || users[0]
    
    try {
      const entryFee4 = await calculateChallengeEntryFee(belt4.id)
      const expiredDate = new Date()
      expiredDate.setDate(expiredDate.getDate() - 1) // Expired yesterday
      
      const challenge4 = await prisma.beltChallenge.create({
        data: {
          beltId: belt4.id,
          challengerId: challenger4.id,
          beltHolderId: belt4.currentHolderId!,
          entryFee: entryFee4,
          coinReward: Math.floor(entryFee4 * 0.6),
          challengerElo: challenger4.eloRating,
          holderElo: holder4!.eloRating,
          eloDifference: Math.abs(challenger4.eloRating - holder4!.eloRating),
          expiresAt: expiredDate,
          status: 'EXPIRED',
        },
      })

      console.log(`  ✅ EXPIRED challenge created (manual): ${challenger4.username} → ${holder4!.username}`)
    } catch (error: any) {
      console.error(`  ❌ Failed to create EXPIRED challenge:`, error.message)
    }
  }
}

async function main() {
  console.log('\n🎯 Creating Belt System Test Data\n')
  console.log('=' .repeat(50))

  try {
    // Check if belt system is enabled
    if (process.env.ENABLE_BELT_SYSTEM !== 'true') {
      console.error('\n❌ ERROR: ENABLE_BELT_SYSTEM is not set to "true"')
      console.error('   Set it in your .env file: ENABLE_BELT_SYSTEM=true')
      process.exit(1)
    }

    // 1. Create or find test users
    console.log('\n👥 Creating/updating test users...')
    const users = []
    for (const userData of TEST_USERS) {
      const user = await findOrCreateUser(userData.username, userData.email, userData.elo)
      users.push(user)
    }

    // 2. Create test belts
    const belts = await createTestBelts(users)

    // 3. Create test challenges
    await createTestChallenges(belts, users)

    // 4. Summary
    console.log('\n' + '='.repeat(50))
    console.log('\n✨ Test Data Summary:\n')

    const beltCounts = await prisma.belt.groupBy({
      by: ['type', 'status'],
      _count: true,
    })

    console.log('📊 Belts by Type and Status:')
    for (const group of beltCounts) {
      console.log(`   ${group.type} - ${group.status}: ${group._count}`)
    }

    const challengeCounts = await prisma.beltChallenge.groupBy({
      by: ['status'],
      _count: true,
    })

    console.log('\n📊 Challenges by Status:')
    for (const group of challengeCounts) {
      console.log(`   ${group.status}: ${group._count}`)
    }

    const usersWithBelts = await prisma.user.findMany({
      where: {
        currentBeltsCount: { gt: 0 },
      },
      select: {
        username: true,
        currentBeltsCount: true,
      },
    })

    console.log('\n👑 Users with Belts:')
    for (const user of usersWithBelts) {
      console.log(`   ${user.username}: ${user.currentBeltsCount} belt(s)`)
    }

    console.log('\n✅ Test data creation complete!')
    console.log('\n📝 Next steps:')
    console.log('   1. Visit http://localhost:3002/belts/room to see belt rooms')
    console.log('   2. Visit http://localhost:3002/admin/belts to manage belts')
    console.log('   3. Test creating challenges, accepting/declining, etc.')
    console.log('')
  } catch (error) {
    console.error('\n❌ Error creating test data:', error)
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
