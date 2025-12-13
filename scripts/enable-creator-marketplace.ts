import { prisma } from '../lib/db/prisma'

async function enableCreatorMarketplace() {
  try {
    console.log('\n=== Enabling Creator Marketplace ===\n')

    // Find or create the setting
    const setting = await prisma.adminSetting.upsert({
      where: { key: 'ADS_CREATOR_MARKETPLACE_ENABLED' },
      update: {
        value: 'true',
        updatedAt: new Date(),
      },
      create: {
        key: 'ADS_CREATOR_MARKETPLACE_ENABLED',
        value: 'true',
        description: 'Enable Creator Marketplace',
        category: 'advertising',
        updatedBy: 'system',
      },
    })

    console.log('✅ Creator Marketplace enabled')
    console.log(`   Setting: ${setting.key}`)
    console.log(`   Value: ${setting.value}`)
    console.log(`   Updated: ${setting.updatedAt}`)

    console.log('\n✅ Creator Marketplace is now enabled')
    console.log('   - Creator dashboard is accessible')
    console.log('   - Advertiser creator discovery is enabled')
    console.log('   - Offer creation is allowed')
    
  } catch (error: any) {
    console.error('\n❌ Error enabling creator marketplace:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

enableCreatorMarketplace()

