/**
 * Script to ensure all database tables exist
 * Run with: npx tsx scripts/ensure-tables.ts
 */

import { prisma } from '../lib/db/prisma';

async function ensureTables() {
  console.log('🔍 Checking database tables...\n');

  const tables = [
    'users',
    'sessions',
    'debates',
    'statements',
    'judges',
    'verdicts',
    'notifications',
    'debate_likes',
    'debate_saves',
    'debate_comments',
    'follows',
    'debate_shares',
    'tags',
    'debate_tags',
    'debate_drafts',
    'debate_votes',
  ];

  const results: { table: string; exists: boolean; error?: string }[] = [];

  for (const table of tables) {
    try {
      // Try to query the table
      await prisma.$queryRawUnsafe(`SELECT 1 FROM ${table} LIMIT 1`);
      results.push({ table, exists: true });
      console.log(`✅ ${table} - exists`);
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      if (errorMessage.includes('no such table') || errorMessage.includes('does not exist')) {
        results.push({ table, exists: false, error: 'Table does not exist' });
        console.log(`❌ ${table} - missing`);
      } else {
        results.push({ table, exists: false, error: errorMessage });
        console.log(`⚠️  ${table} - error: ${errorMessage}`);
      }
    }
  }

  console.log('\n📊 Summary:');
  const existing = results.filter((r) => r.exists).length;
  const missing = results.filter((r) => !r.exists).length;
  console.log(`✅ Existing: ${existing}`);
  console.log(`❌ Missing: ${missing}`);

  if (missing > 0) {
    console.log('\n💡 To create missing tables, run:');
    console.log('   npx prisma migrate dev');
    console.log('   or');
    console.log('   npx prisma db push');
  } else {
    console.log('\n✅ All tables exist!');
  }

  await prisma.$disconnect();
}

ensureTables().catch((error) => {
  console.error('❌ Error checking tables:', error);
  process.exit(1);
});










