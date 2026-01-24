/**
 * Add Critical Performance Indexes
 * Run with: npx tsx scripts/add-performance-indexes.ts
 *
 * This script adds composite indexes to improve query performance for common operations.
 * These indexes are safe to add to a production database without downtime.
 */

import { prisma } from '../lib/db/prisma'

async function addPerformanceIndexes() {
  console.log('Adding critical performance indexes...\n')

  try {
    // These are raw SQL commands to create indexes if they don't exist
    const indexCommands = [
      // Debate indexes
      {
        name: 'idx_debates_status_visibility',
        sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_debates_status_visibility ON debates (status, visibility)',
        description: 'Improve performance for listing debates by status and visibility'
      },
      {
        name: 'idx_debates_challenger_status',
        sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_debates_challenger_status ON debates (challenger_id, status)',
        description: 'Improve performance for getting user\'s debates by status'
      },
      {
        name: 'idx_debates_opponent_status',
        sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_debates_opponent_status ON debates (opponent_id, status)',
        description: 'Improve performance for getting opponent\'s debates by status'
      },

      // Notification indexes
      {
        name: 'idx_notifications_user_read',
        sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_read ON notifications (user_id, read)',
        description: 'Improve performance for getting unread notifications for user'
      },
      {
        name: 'idx_notifications_created',
        sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_created ON notifications (created_at DESC)',
        description: 'Improve performance for sorting notifications by date'
      },

      // BeltChallenge indexes
      {
        name: 'idx_belt_challenges_expires_status',
        sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_belt_challenges_expires_status ON belt_challenges (expires_at, status)',
        description: 'Improve performance for cron job finding expired challenges'
      },
      {
        name: 'idx_belt_challenges_belt_status',
        sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_belt_challenges_belt_status ON belt_challenges (belt_id, status)',
        description: 'Improve performance for getting pending challenges for a belt'
      },

      // Tournament indexes
      {
        name: 'idx_tournaments_status_start',
        sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tournaments_status_start ON tournaments (status, start_date)',
        description: 'Improve performance for finding upcoming tournaments'
      },

      // AdContract indexes (for finance queries)
      {
        name: 'idx_ad_contracts_signed_status',
        sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ad_contracts_signed_status ON ad_contracts (signed_at, status)',
        description: 'Improve performance for finance revenue calculations'
      },
      {
        name: 'idx_ad_contracts_payout_date',
        sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ad_contracts_payout_date ON ad_contracts (payout_date) WHERE payout_sent = true',
        description: 'Improve performance for counting payouts in date range'
      },
    ]

    console.log(`Creating ${indexCommands.length} indexes using CONCURRENTLY (safe for production)...\n`)

    for (const { name, sql, description } of indexCommands) {
      try {
        console.log(`Creating ${name}...`)
        console.log(`  Purpose: ${description}`)

        await prisma.$executeRawUnsafe(sql)

        console.log(`  ✅ Created successfully\n`)
      } catch (error: any) {
        // Check if error is because index already exists
        if (error.message.includes('already exists') || error.code === '42P07') {
          console.log(`  ℹ️  Index already exists, skipping\n`)
        } else {
          console.error(`  ❌ Failed to create index:`, error.message)
          console.error(`     This is non-fatal, continuing...\n`)
        }
      }
    }

    console.log('✅ Index creation complete!')
    console.log('\nNext steps:')
    console.log('1. Monitor database performance using Neon dashboard')
    console.log('2. Check slow query logs for any remaining bottlenecks')
    console.log('3. Run ANALYZE on affected tables to update statistics:')
    console.log('   psql -c "ANALYZE debates, notifications, belt_challenges, tournaments, ad_contracts;"')

  } catch (error) {
    console.error('❌ Failed to add performance indexes:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

addPerformanceIndexes()
  .then(() => {
    console.log('\nScript finished successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\nScript failed:', error)
    process.exit(1)
  })
