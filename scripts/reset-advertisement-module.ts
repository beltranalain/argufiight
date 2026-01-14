import { prisma } from '../lib/db/prisma.js'

async function resetAdvertisementModule() {
  try {
    console.log('\n=== Resetting Advertisement Module ===\n')
    
    // Delete in order to avoid foreign key constraints
    // 1. Ad Contracts (depends on offers and campaigns)
    console.log('1. Deleting Ad Contracts...')
    const contractsDeleted = await prisma.adContract.deleteMany({})
    console.log(`   ✓ Deleted ${contractsDeleted.count} ad contracts`)
    
    // 2. Offers (depends on campaigns and advertisers)
    console.log('2. Deleting Offers...')
    const offersDeleted = await prisma.offer.deleteMany({})
    console.log(`   ✓ Deleted ${offersDeleted.count} offers`)
    
    // 3. Campaigns (depends on advertisers)
    console.log('3. Deleting Campaigns...')
    const campaignsDeleted = await prisma.campaign.deleteMany({})
    console.log(`   ✓ Deleted ${campaignsDeleted.count} campaigns`)
    
    // 4. Advertisements (standalone)
    console.log('4. Deleting Advertisements...')
    const adsDeleted = await prisma.advertisement.deleteMany({})
    console.log(`   ✓ Deleted ${adsDeleted.count} advertisements`)
    
    // 5. Advertisers (might have other dependencies, but should be last)
    console.log('5. Deleting Advertisers...')
    const advertisersDeleted = await prisma.advertiser.deleteMany({})
    console.log(`   ✓ Deleted ${advertisersDeleted.count} advertisers`)
    
    // 6. Creator Tax Info (might reference contracts, but we'll leave it for now)
    // If you want to delete creator tax info too, uncomment:
    // console.log('6. Deleting Creator Tax Info...')
    // const taxInfoDeleted = await prisma.creatorTaxInfo.deleteMany({})
    // console.log(`   ✓ Deleted ${taxInfoDeleted.count} creator tax info records`)
    
    console.log('\n✅ Advertisement module reset complete!')
    console.log('\nSummary:')
    console.log(`  - Ad Contracts: ${contractsDeleted.count}`)
    console.log(`  - Offers: ${offersDeleted.count}`)
    console.log(`  - Campaigns: ${campaignsDeleted.count}`)
    console.log(`  - Advertisements: ${adsDeleted.count}`)
    console.log(`  - Advertisers: ${advertisersDeleted.count}`)
    
  } catch (error: any) {
    console.error('\n❌ Error resetting advertisement module:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

resetAdvertisementModule()
