import { prisma } from '../lib/db/prisma'

async function disableCreatorMarketplace() {
  try {
    console.log('\n=== Disabling Creator Marketplace ===\n')

    // Find or create the setting
    const setting = await prisma.adminSetting.upsert({
      where: { key: 'ADS_CREATOR_MARKETPLACE_ENABLED' },
      update: {
        value: 'false',
        updatedAt: new Date(),
      },
      create: {
        key: 'ADS_CREATOR_MARKETPLACE_ENABLED',
        value: 'false',
        description: 'Enable Creator Marketplace',
        category: 'advertising',
        updatedBy: 'system',
      },
    })

    console.log('✅ Creator Marketplace disabled')
    console.log(`   Setting: ${setting.key}`)
    console.log(`   Value: ${setting.value}`)
    console.log(`   Updated: ${setting.updatedAt}`)

    // Also disable platform ads if needed (optional)
    const platformAdsSetting = await prisma.adminSetting.findUnique({
      where: { key: 'ADS_PLATFORM_ENABLED' },
    })

    if (platformAdsSetting) {
      console.log(`\n📋 Platform Ads status: ${platformAdsSetting.value}`)
    }

    console.log('\n✅ Creator Marketplace is now disabled')
    console.log('   - Creator dashboard will be hidden')
    console.log('   - Advertiser creator discovery will be disabled')
    console.log('   - Offer creation will be blocked')
    
  } catch (error: any) {
    console.error('\n❌ Error disabling creator marketplace:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

disableCreatorMarketplace()


