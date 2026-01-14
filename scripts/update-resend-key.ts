import { prisma } from '../lib/db/prisma'

async function updateResendKey() {
  console.log('\n=== Updating Resend API Key ===\n')

  // The correct key from your Resend dashboard
  const correctKey = 're_WieWecVz_9tGSPRESaiDD7YaPNAq7QCwh'

  try {
    // Check current key
    const currentSetting = await prisma.adminSetting.findUnique({
      where: { key: 'RESEND_API_KEY' },
    })

    if (currentSetting) {
      console.log('Current key in database:')
      console.log(`  ${currentSetting.value.substring(0, 15)}...`)
      console.log(`  Updated: ${currentSetting.updatedAt}`)
    } else {
      console.log('No RESEND_API_KEY found in database')
    }

    // Update to correct key
    console.log('\nUpdating to correct key...')
    const updated = await prisma.adminSetting.upsert({
      where: { key: 'RESEND_API_KEY' },
      update: {
        value: correctKey,
        updatedAt: new Date(),
      },
      create: {
        key: 'RESEND_API_KEY',
        value: correctKey,
        encrypted: true,
        category: 'general',
        description: 'Resend API key for sending emails',
      },
    })

    console.log('✅ API key updated successfully!')
    console.log(`   New key: ${updated.value.substring(0, 15)}...`)
    console.log(`   Updated at: ${updated.updatedAt}`)

    console.log('\n📝 Next steps:')
    console.log('   1. Restart your dev server (npm run dev)')
    console.log('   2. Try resending an email from the Email Usage tab')
    console.log('   3. Or run: npx tsx scripts/test-resend-send-email.ts')

  } catch (error: any) {
    console.error('\n❌ Error updating API key:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

updateResendKey()
