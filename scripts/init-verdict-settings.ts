import { prisma } from '../lib/db/prisma'

async function initializeVerdictSettings() {
  console.log('Initializing verdict settings...')

  try {
    // Create or update VERDICT_TIE_THRESHOLD setting
    await prisma.adminSetting.upsert({
      where: { key: 'VERDICT_TIE_THRESHOLD' },
      update: {
        // Don't overwrite if it already exists
      },
      create: {
        key: 'VERDICT_TIE_THRESHOLD',
        value: '5',
        description: 'Score difference threshold for considering a debate a tie. If total scores are within this many points, the result is a tie.',
        category: 'verdicts',
        updatedBy: 'SYSTEM',
      },
    })

    console.log('✅ VERDICT_TIE_THRESHOLD setting initialized (default: 5)')
    console.log('\nVerdict settings initialization complete!')
  } catch (error) {
    console.error('❌ Failed to initialize verdict settings:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

initializeVerdictSettings()
  .then(() => {
    console.log('Script finished successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })
