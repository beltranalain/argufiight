import { prisma } from '../lib/db/prisma'

async function checkTickerAds() {
  console.log('\n=== Checking Ticker Ads ===\n')

  try {
    const now = new Date()
    
    // Check for active ads that should appear in ticker
    const activeAds = await prisma.advertisement.findMany({
      where: {
        status: 'ACTIVE',
        type: { in: ['BANNER', 'IN_FEED'] },
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: { gte: now } },
          { startDate: null, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: null },
        ],
      },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        creativeUrl: true,
        targetUrl: true,
        startDate: true,
        endDate: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    console.log(`Found ${activeAds.length} active ads for ticker:\n`)

    if (activeAds.length === 0) {
      console.log('❌ No active ads found!')
      console.log('\nTo show ads in the ticker, you need:')
      console.log('1. An ad with type: BANNER or IN_FEED')
      console.log('2. Status: ACTIVE')
      console.log('3. creativeUrl must be set (image URL)')
      console.log('4. Date range must be valid (or null for no restrictions)')
    } else {
      activeAds.forEach((ad, index) => {
        console.log(`${index + 1}. ${ad.title || 'Untitled'}`)
        console.log(`   Type: ${ad.type}`)
        console.log(`   Status: ${ad.status}`)
        console.log(`   Has Image: ${ad.creativeUrl ? '✅ Yes' : '❌ No (required!)'}`)
        console.log(`   Target URL: ${ad.targetUrl || 'None'}`)
        console.log(`   Date Range: ${ad.startDate ? ad.startDate.toLocaleDateString() : 'No start'} - ${ad.endDate ? ad.endDate.toLocaleDateString() : 'No end'}`)
        console.log(`   Created: ${ad.createdAt.toLocaleDateString()}`)
        console.log('')
      })

      // Check which ads have creativeUrl (required for ticker)
      const adsWithImage = activeAds.filter(ad => ad.creativeUrl)
      console.log(`\n✅ ${adsWithImage.length} ads have images and will show in ticker`)
      
      if (adsWithImage.length < activeAds.length) {
        console.log(`⚠️  ${activeAds.length - adsWithImage.length} ads are missing images (creativeUrl)`)
      }
    }

    // Also check all ads to see what's available
    console.log('\n=== All Ads Summary ===\n')
    const allAds = await prisma.advertisement.groupBy({
      by: ['type', 'status'],
      _count: true,
    })

    allAds.forEach(group => {
      console.log(`${group.type} - ${group.status}: ${group._count}`)
    })

  } catch (error: any) {
    console.error('❌ Error checking ads:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkTickerAds()
