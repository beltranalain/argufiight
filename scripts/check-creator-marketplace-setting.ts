import { prisma } from '../lib/db/prisma'

async function checkCreatorMarketplaceSetting() {
  try {
    console.log('\n=== Checking Creator Marketplace Setting ===\n')

    const setting = await prisma.adminSetting.findUnique({
      where: { key: 'ADS_CREATOR_MARKETPLACE_ENABLED' },
    })

    if (setting) {
      console.log('✅ Setting found:')
      console.log(`   Key: ${setting.key}`)
      console.log(`   Value: ${setting.value}`)
      console.log(`   Updated By: ${setting.updatedBy}`)
      console.log(`   Updated At: ${setting.updatedAt}`)
      console.log(`   Created At: ${setting.createdAt}`)
    } else {
      console.log('❌ Setting NOT found in database')
      console.log('   This means it will default to false')
    }

    // Check all advertising-related settings
    console.log('\n=== All Advertising Settings ===\n')
    const allSettings = await prisma.adminSetting.findMany({
      where: {
        key: {
          startsWith: 'ADS_',
        },
      },
    })

    if (allSettings.length > 0) {
      allSettings.forEach((s) => {
        console.log(`${s.key}: ${s.value} (updated: ${s.updatedAt})`)
      })
    } else {
      console.log('No advertising settings found')
    }
  } catch (error: any) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkCreatorMarketplaceSetting()
