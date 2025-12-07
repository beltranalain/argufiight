import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addRematchFields() {
  try {
    console.log('Adding rematch fields to debates table...')
    
    // Add rematch fields
    const fields = [
      { name: 'rematch_requested_by', type: 'TEXT' },
      { name: 'rematch_requested_at', type: 'DATETIME' },
      { name: 'rematch_status', type: 'TEXT' },
      { name: 'original_debate_id', type: 'TEXT' },
      { name: 'rematch_debate_id', type: 'TEXT' },
    ]

    for (const field of fields) {
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE debates ADD COLUMN ${field.name} ${field.type}
        `)
        console.log(`✅ Added ${field.name}`)
      } catch (error) {
        if (error.message?.includes('duplicate column') || error.message?.includes('already exists')) {
          console.log(`✅ ${field.name} already exists`)
        } else {
          throw error
        }
      }
    }

    console.log('✅ Rematch fields added successfully!')
    return true
  } catch (error) {
    console.error('❌ Error adding rematch fields:', error.message)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

addRematchFields().then((success) => {
  process.exit(success ? 0 : 1)
})



