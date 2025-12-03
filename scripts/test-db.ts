#!/usr/bin/env tsx
/**
 * Quick database verification script
 * Run with: tsx scripts/test-db.ts
 */

import { prisma } from '../lib/db/prisma'
import { getAllJudges, getPlatformStats } from '../lib/db/queries'

async function testDatabase() {
  console.log('🧪 Testing Database Setup...\n')

  try {
    // Test 1: Check judges
    console.log('1️⃣ Checking Judges...')
    const judges = await getAllJudges()
    if (judges.length === 7) {
      console.log(`   ✅ Found ${judges.length} judges`)
      judges.forEach(j => console.log(`      - ${j.name} ${j.emoji}`))
    } else {
      console.log(`   ❌ Expected 7 judges, found ${judges.length}`)
    }

    // Test 2: Check platform stats
    console.log('\n2️⃣ Checking Platform Stats...')
    const stats = await getPlatformStats()
    console.log(`   ✅ Total Users: ${stats.totalUsers}`)
    console.log(`   ✅ Total Debates: ${stats.totalDebates}`)
    console.log(`   ✅ Active Debates: ${stats.activeDebates}`)
    console.log(`   ✅ Completed Debates: ${stats.completedDebates}`)
    console.log(`   ✅ Total Verdicts: ${stats.totalVerdicts}`)

    // Test 3: Check tables exist (by trying to count)
    console.log('\n3️⃣ Verifying Tables...')
    const tables = [
      { name: 'users', model: prisma.user },
      { name: 'sessions', model: prisma.session },
      { name: 'debates', model: prisma.debate },
      { name: 'statements', model: prisma.statement },
      { name: 'judges', model: prisma.judge },
      { name: 'verdicts', model: prisma.verdict },
      { name: 'notifications', model: prisma.notification },
      { name: 'chatMessages', model: prisma.chatMessage },
      { name: 'reports', model: prisma.report },
      { name: 'predictions', model: prisma.prediction },
      { name: 'adminSettings', model: prisma.adminSetting },
      { name: 'seedDebates', model: prisma.seedDebate },
    ]

    for (const table of tables) {
      try {
        // Use type assertion to handle Prisma model count
        const count = await (table.model as any).count()
        console.log(`   ✅ ${table.name}: ${count} records`)
      } catch (error: any) {
        console.log(`   ❌ ${table.name}: Error - ${error.message}`)
      }
    }

    // Test 4: Check if we can query a user
    console.log('\n4️⃣ Testing User Queries...')
    const userCount = await prisma.user.count()
    if (userCount > 0) {
      const firstUser = await prisma.user.findFirst({
        select: {
          id: true,
          email: true,
          username: true,
          eloRating: true,
        },
      })
      console.log(`   ✅ Found ${userCount} user(s)`)
      if (firstUser) {
        console.log(`      Example: ${firstUser.username} (${firstUser.email}) - ELO: ${firstUser.eloRating}`)
      }
    } else {
      console.log('   ⚠️  No users found (this is OK if you haven\'t signed up yet)')
    }

    console.log('\n✅ Database tests completed successfully!')
    console.log('\n📋 Next Steps:')
    console.log('   1. Test authentication: Sign up at /signup')
    console.log('   2. Test login: Log in at /login')
    console.log('   3. Check Prisma Studio: npx prisma studio')

  } catch (error) {
    console.error('\n❌ Database test failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()

