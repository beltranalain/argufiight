import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addViewCountColumn() {
  try {
    console.log('Adding view_count column to debates table...')
    
    // SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
    // So we'll try to add it and catch the error if it already exists
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE debates ADD COLUMN view_count INTEGER DEFAULT 0
      `)
      console.log('✅ view_count column added successfully!')
    } catch (error) {
      if (error.message?.includes('duplicate column') || error.message?.includes('already exists')) {
        console.log('✅ view_count column already exists')
      } else {
        throw error
      }
    }
  } catch (error) {
    console.error('❌ Error adding view_count column:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

addViewCountColumn()










