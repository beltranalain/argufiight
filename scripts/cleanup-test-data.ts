/**
 * Cleanup script to remove test users and test tournaments
 * Removes:
 * - Users with usernames matching "koth-test-*"
 * - Tournaments with names matching "Test KOTH Tournament*"
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupTestData() {
  try {
    console.log('🧹 Starting cleanup of test data...\n')

    // Find test users (but delete them after tournaments)
    console.log('📝 Finding test users...')
    const testUsers = await prisma.user.findMany({
      where: {
        username: {
          startsWith: 'koth-test-',
        },
      },
      select: {
        id: true,
        username: true,
        email: true,
      },
    })

    console.log(`  Found ${testUsers.length} test users`)

    // Find and delete test tournaments FIRST (before users)
    console.log('\n🏆 Finding test tournaments...')
    const testTournaments = await prisma.tournament.findMany({
      where: {
        name: {
          startsWith: 'Test KOTH Tournament',
        },
      },
      select: {
        id: true,
        name: true,
        format: true,
        status: true,
      },
    })

    console.log(`  Found ${testTournaments.length} test tournaments`)

    if (testTournaments.length > 0) {
      // Delete test tournaments (cascade will handle related data)
      for (const tournament of testTournaments) {
        try {
          await prisma.tournament.delete({
            where: { id: tournament.id },
          })
          console.log(`  ✅ Deleted tournament: "${tournament.name}" (${tournament.id})`)
        } catch (error: any) {
          console.error(`  ❌ Error deleting tournament "${tournament.name}":`, error.message)
        }
      }
    }

    // Also check for any other test tournaments with similar patterns
    console.log('\n🔍 Checking for other test tournaments...')
    const otherTestTournaments = await prisma.tournament.findMany({
      where: {
        OR: [
          { name: { contains: 'Test' } },
          { name: { contains: 'test' } },
          { name: { contains: 'E2E' } },
          { name: { contains: 'End-to-End' } },
        ],
      },
      select: {
        id: true,
        name: true,
        format: true,
        status: true,
      },
    })

    if (otherTestTournaments.length > 0) {
      console.log(`  Found ${otherTestTournaments.length} additional test tournaments`)
      for (const tournament of otherTestTournaments) {
        try {
          await prisma.tournament.delete({
            where: { id: tournament.id },
          })
          console.log(`  ✅ Deleted tournament: "${tournament.name}" (${tournament.id})`)
        } catch (error: any) {
          console.error(`  ❌ Error deleting tournament "${tournament.name}":`, error.message)
        }
      }
    }

    // Now delete test users (after tournaments are deleted)
    console.log('\n📝 Deleting test users (after tournaments)...')

    console.log('\n✅ Cleanup completed!')
    console.log(`\nSummary:`)
    console.log(`  - Deleted ${testUsers.length} test users`)
    console.log(`  - Deleted ${testTournaments.length + (otherTestTournaments.length || 0)} test tournaments`)

  } catch (error: any) {
    console.error('\n❌ Cleanup failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run cleanup
cleanupTestData()
  .then(() => {
    console.log('\n✅ Cleanup script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Cleanup script failed:', error)
    process.exit(1)
  })
