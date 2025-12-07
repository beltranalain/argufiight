/**
 * Script to ensure tags and debate_tags tables exist
 * Run this before starting the dev server if you see table errors
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function ensureTagsTables() {
  console.log('🔍 Ensuring tags and debate_tags tables exist...\n');

  try {
    // Create tags table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        color TEXT DEFAULT '#00aaff',
        usage_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ tags table ready');

    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON tags(usage_count);`);

    // Create debate_tags table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS debate_tags (
        id TEXT PRIMARY KEY,
        debate_id TEXT NOT NULL,
        tag_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(debate_id, tag_id),
        FOREIGN KEY (debate_id) REFERENCES debates(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      );
    `);
    console.log('✅ debate_tags table ready');

    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_debate_tags_debate_id ON debate_tags(debate_id);`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_debate_tags_tag_id ON debate_tags(tag_id);`);

    // Verify tables exist
    await prisma.$queryRawUnsafe('SELECT 1 FROM tags LIMIT 1');
    await prisma.$queryRawUnsafe('SELECT 1 FROM debate_tags LIMIT 1');
    
    console.log('\n✅ All tag tables verified and ready!');
    return true;
  } catch (error) {
    console.error('❌ Error ensuring tables:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

ensureTagsTables().then((success) => {
  process.exit(success ? 0 : 1);
});



