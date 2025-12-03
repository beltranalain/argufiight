import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function addDebateImagesTable() {
  console.log('Creating debate_images table...')

  try {
    // Create the debate_images table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS debate_images (
        id TEXT PRIMARY KEY,
        debate_id TEXT NOT NULL,
        url TEXT NOT NULL,
        alt TEXT,
        caption TEXT,
        "order" INTEGER NOT NULL DEFAULT 0,
        width INTEGER,
        height INTEGER,
        file_size INTEGER,
        mime_type TEXT,
        uploaded_by TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (debate_id) REFERENCES debates(id) ON DELETE CASCADE
      );
    `)

    // Create indexes
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_debate_images_debate_id ON debate_images(debate_id);
    `)
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_debate_images_order ON debate_images("order");
    `)

    console.log('✅ debate_images table created successfully!')
    return true
  } catch (error) {
    console.error('❌ Error creating debate_images table:', error.message)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

addDebateImagesTable().then((success) => {
  process.exit(success ? 0 : 1)
}).catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

