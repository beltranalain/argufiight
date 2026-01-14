import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const email = 'info@kamioi.com'
    
    // Check advertiser
    const advertiser = await prisma.advertiser.findUnique({
      where: { contactEmail: email },
      select: { id: true, status: true, companyName: true },
    })
    
    console.log('Advertiser:', advertiser)
    
    if (!advertiser || advertiser.status !== 'APPROVED') {
      console.log('⚠️  Advertiser not found or not approved')
      return
    }
    
    // Check IN_FEED ads
    const inFeedAds = await prisma.advertisement.findMany({
      where: {
        status: 'ACTIVE',
        type: 'IN_FEED',
      },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        creativeUrl: true,
        startDate: true,
        endDate: true,
      },
    })
    
    console.log('\nIN_FEED ads:', inFeedAds.length)
    inFeedAds.forEach(ad => {
      console.log(`  - ${ad.title} (${ad.id})`)
      console.log(`    Has image: ${!!ad.creativeUrl}`)
      console.log(`    Date range: ${ad.startDate} to ${ad.endDate}`)
    })
    
    // Check campaigns
    const campaigns = await prisma.campaign.findMany({
      where: {
        advertiserId: advertiser.id,
      },
      select: {
        id: true,
        name: true,
        status: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    })
    
    console.log('\nRecent campaigns:', campaigns.length)
    campaigns.forEach(c => {
      console.log(`  - ${c.name} (${c.status}) - Updated: ${c.updatedAt}`)
    })
    
    // Check offers
    const offers = await prisma.offer.findMany({
      where: {
        advertiserId: advertiser.id,
      },
      select: {
        id: true,
        status: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    })
    
    console.log('\nRecent offers:', offers.length)
    offers.forEach(o => {
      console.log(`  - Offer ${o.id} (${o.status}) - Updated: ${o.updatedAt}`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
