import { prisma } from '../lib/db/prisma'

async function checkDirectAd() {
  try {
    console.log('\n=== Checking Direct Ads ===\n')

    // Check all Direct Ads
    const ads = await prisma.advertisement.findMany({
      orderBy: { createdAt: 'desc' },
    })

    if (ads.length === 0) {
      console.log('❌ No Direct Ads found in database')
      return
    }

    console.log(`✅ Found ${ads.length} Direct Ad(s):\n`)

    const now = new Date()

    for (const ad of ads) {
      console.log(`Ad: ${ad.title}`)
      console.log(`  ID: ${ad.id}`)
      console.log(`  Type: ${ad.type}`)
      console.log(`  Status: ${ad.status}`)
      console.log(`  Start Date: ${ad.startDate ? ad.startDate.toISOString() : 'None'}`)
      console.log(`  End Date: ${ad.endDate ? ad.endDate.toISOString() : 'None'}`)
      console.log(`  Creative URL: ${ad.creativeUrl}`)
      console.log(`  Target URL: ${ad.targetUrl}`)

      // Check if ad should be active
      const isInDateRange = 
        (!ad.startDate || ad.startDate <= now) && 
        (!ad.endDate || ad.endDate >= now)

      if (ad.status === 'ACTIVE' && isInDateRange && ad.creativeUrl) {
        console.log(`  ✅ Should be displayed (ACTIVE, valid dates, has image)`)
      } else {
        console.log(`  ⚠️  Will NOT be displayed:`)
        if (ad.status !== 'ACTIVE') console.log(`     - Status is "${ad.status}" (needs to be ACTIVE)`)
        if (!isInDateRange) console.log(`     - Date range issue`)
        if (!ad.creativeUrl) console.log(`     - Missing creative URL`)
      }
      console.log('')
    }

    // Test ad selection for PROFILE_BANNER
    console.log('\n=== Testing Ad Selection (PROFILE_BANNER) ===\n')
    
    const activeAds = await prisma.advertisement.findMany({
      where: {
        type: 'BANNER',
        status: 'ACTIVE',
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: { gte: now } },
          { startDate: null, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: null },
        ],
      },
      orderBy: { createdAt: 'desc' },
    })

    if (activeAds.length > 0) {
      console.log(`✅ Found ${activeAds.length} active BANNER ad(s) that should be selectable`)
      console.log(`   First ad: ${activeAds[0].title}`)
    } else {
      console.log('❌ No active BANNER ads found that match date criteria')
    }

  } catch (error: any) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkDirectAd()
