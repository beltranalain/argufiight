/**
 * Script to apply the tournament format migration manually
 * This adds the format column and other Championship format fields
 */

import { prisma } from '../lib/db/prisma'

async function applyMigration() {
  try {
    console.log('🔄 Applying tournament format migration...\n')

    // Check if format column already exists
    const checkResult = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tournaments' AND column_name = 'format'
    `

    if (checkResult.length > 0) {
      console.log('✅ Format column already exists - migration already applied')
      return
    }

    console.log('📝 Format column does not exist - applying migration...\n')

    // Apply migration SQL
    await prisma.$executeRaw`
      -- Create TournamentFormat enum if it doesn't exist
      DO $$ BEGIN
        CREATE TYPE "TournamentFormat" AS ENUM ('BRACKET', 'CHAMPIONSHIP');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `

    await prisma.$executeRaw`
      -- Add format column with default
      ALTER TABLE "tournaments" 
      ADD COLUMN IF NOT EXISTS "format" "TournamentFormat" NOT NULL DEFAULT 'BRACKET';
    `

    await prisma.$executeRaw`
      -- Add assigned_judges column
      ALTER TABLE "tournaments" 
      ADD COLUMN IF NOT EXISTS "assigned_judges" TEXT;
    `

    await prisma.$executeRaw`
      -- Add selected_position to tournament_participants
      ALTER TABLE "tournament_participants" 
      ADD COLUMN IF NOT EXISTS "selected_position" TEXT;
    `

    await prisma.$executeRaw`
      -- Add score fields to tournament_matches
      ALTER TABLE "tournament_matches" 
      ADD COLUMN IF NOT EXISTS "participant1_score" INTEGER;
    `

    await prisma.$executeRaw`
      ALTER TABLE "tournament_matches" 
      ADD COLUMN IF NOT EXISTS "participant2_score" INTEGER;
    `

    await prisma.$executeRaw`
      ALTER TABLE "tournament_matches" 
      ADD COLUMN IF NOT EXISTS "participant1_score_breakdown" JSONB;
    `

    await prisma.$executeRaw`
      ALTER TABLE "tournament_matches" 
      ADD COLUMN IF NOT EXISTS "participant2_score_breakdown" JSONB;
    `

    console.log('✅ Migration applied successfully!\n')

    // Verify
    const verifyResult = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tournaments' AND column_name = 'format'
    `

    if (verifyResult.length > 0) {
      console.log('✅ Verification: Format column now exists')
    } else {
      console.log('❌ Verification failed: Format column still missing')
    }
  } catch (error: any) {
    console.error('❌ Error applying migration:', error)
    console.error('Error message:', error.message)
    console.error('Error code:', error.code)
  } finally {
    await prisma.$disconnect()
  }
}

applyMigration()

