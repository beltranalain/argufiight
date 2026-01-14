import { prisma } from '../lib/db/prisma.js'

async function checkRemainingData() {
  try {
    console.log('\n=== Checking for Remaining Advertisement-Related Data ===\n')
    
    // Check all models
    const checks = [
      { name: 'Ad Contracts', model: 'adContract' },
      { name: 'Offers', model: 'offer' },
      { name: 'Campaigns', model: 'campaign' },
      { name: 'Advertisements', model: 'advertisement' },
      { name: 'Advertisers', model: 'advertiser' },
    ]
    
    let allEmpty = true
    for (const check of checks) {
      try {
        const count = await (prisma as any)[check.model]?.count()
        if (count > 0) {
          console.log(`⚠️  ${check.name}: ${count} records still exist`)
          allEmpty = false
        } else {
          console.log(`✓ ${check.name}: 0 records`)
        }
      } catch (e: any) {
        console.log(`? ${check.name}: Could not check (${e.message})`)
      }
    }
    
    if (allEmpty) {
      console.log('\n✅ All advertisement data has been successfully deleted!')
    } else {
      console.log('\n⚠️  Some data still exists. You may need to check foreign key constraints.')
    }
    
  } catch (error: any) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkRemainingData()
