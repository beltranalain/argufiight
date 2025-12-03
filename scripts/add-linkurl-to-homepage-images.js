import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('Adding linkUrl column to homepage_images table...')
  
  try {
    // Check if column already exists
    const tableInfo = await prisma.$queryRawUnsafe(`
      PRAGMA table_info(homepage_images);
    `)
    
    const hasLinkUrl = tableInfo.some((col) => col.name === 'link_url')
    
    if (hasLinkUrl) {
      console.log('link_url column already exists. Skipping...')
      return
    }
    
    // Add the column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE homepage_images
      ADD COLUMN link_url TEXT;
    `)
    
    console.log('✅ Successfully added link_url column to homepage_images table')
  } catch (error) {
    console.error('❌ Error adding column:', error)
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

