/**
 * Script to add KING_OF_THE_HILL to TournamentFormat enum
 * Run this directly on the database if the enum value is missing
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Adding KING_OF_THE_HILL to TournamentFormat enum...')
  
  try {
    // Use raw SQL to add the enum value
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum 
          WHERE enumlabel = 'KING_OF_THE_HILL' 
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'TournamentFormat')
        ) THEN
          ALTER TYPE "TournamentFormat" ADD VALUE 'KING_OF_THE_HILL';
        END IF;
      END $$;
    `)
    
    console.log('✅ Successfully added KING_OF_THE_HILL to TournamentFormat enum')
  } catch (error: any) {
    console.error('❌ Error adding enum value:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
