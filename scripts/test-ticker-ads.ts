import { prisma } from '../lib/db/prisma'

async function testTickerAds() {
  console.log('\n=== Testing Ticker Ad Display ===\n')

  try {
    const now = new Date()
    
    // Check what ads exist
    const allAds = await prisma.advertisement.findMany({
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        creativeUrl: true,
        startDate: true,
        endDate: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    console.log(`Total ads in database: ${allAds.length}\n`)

    if (allAds.length === 0) {
      console.log('❌ No ads found in database.')
      console.log('   Create an ad in Admin → Advertisements → Direct Ads')
      return
    }

    console.log('All Ads:')
    allAds.forEach((ad, index) => {
      console.log(`\n${index + 1}. ${ad.title || 'Untitled'}`)
      console.log(`   Type: ${ad.type}`)
      console.log(`   Status: ${ad.status}`)
      console.log(`   Has Image: ${!!ad.creativeUrl}`)
      console.log(`   Image URL: ${ad.creativeUrl || 'N/A'}`)
      console.log(`   Start Date: ${ad.startDate ? ad.startDate.toISOString() : 'None'}`)
      console.log(`   End Date: ${ad.endDate ? ad.endDate.toISOString() : 'None'}`)
      
      // Check if ad is currently active
      const isActive = ad.status === 'ACTIVE'
      const hasImage = !!ad.creativeUrl
      const isInDateRange = !ad.startDate || ad.startDate <= now
      const isNotExpired = !ad.endDate || ad.endDate >= now
      const isEligible = isActive && hasImage && isInDateRange && isNotExpired
      const isTickerType = ad.type === 'BANNER' || ad.type === 'IN_FEED'
      
      console.log(`   Eligible for Ticker: ${isEligible && isTickerType ? '✅ YES' : '❌ NO'}`)
      if (!isActive) console.log(`      - Status is not ACTIVE`)
      if (!hasImage) console.log(`      - Missing creativeUrl (image)`)
      if (!isInDateRange) console.log(`      - Start date is in the future`)
      if (!isNotExpired) console.log(`      - End date has passed`)
      if (!isTickerType) console.log(`      - Type is ${ad.type} (needs BANNER or IN_FEED)`)
    })

    // Check what the ticker API would return
    console.log('\n=== Checking Ticker API Query ===\n')
    
    const tickerAd = await prisma.advertisement.findFirst({
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
      orderBy: { createdAt: 'desc' },
    })

    if (tickerAd && tickerAd.creativeUrl) {
      console.log('✅ Ticker would show this ad:')
      console.log(`   Title: ${tickerAd.title || 'Untitled'}`)
      console.log(`   Type: ${tickerAd.type}`)
      console.log(`   Image: ${tickerAd.creativeUrl}`)
      console.log(`   Destination: ${tickerAd.targetUrl || 'N/A'}`)
    } else if (tickerAd && !tickerAd.creativeUrl) {
      console.log('⚠️  Found eligible ad but missing creativeUrl:')
      console.log(`   Title: ${tickerAd.title || 'Untitled'}`)
      console.log(`   Type: ${tickerAd.type}`)
      console.log(`   Status: ${tickerAd.status}`)
      console.log('   ❌ This ad will NOT appear in ticker (no image)')
    } else {
      console.log('❌ No eligible ads found for ticker')
      console.log('   Requirements:')
      console.log('   - Status: ACTIVE')
      console.log('   - Type: BANNER or IN_FEED')
      console.log('   - Has creativeUrl (image)')
      console.log('   - Within date range (if dates are set)')
    }

    // Test the actual API endpoint
    console.log('\n=== Testing Ticker API Endpoint ===\n')
    try {
      const response = await fetch('http://localhost:3000/api/ticker')
      if (response.ok) {
        const data = await response.json()
        const sponsored = data.updates?.find((u: any) => u.type === 'SPONSORED')
        if (sponsored) {
          console.log('✅ Ticker API returns sponsored ad:')
          console.log(`   Title: ${sponsored.title}`)
          console.log(`   Message: ${sponsored.message}`)
          console.log(`   Image URL: ${sponsored.imageUrl || 'N/A'}`)
          console.log(`   Destination: ${sponsored.destinationUrl || 'N/A'}`)
        } else {
          console.log('⚠️  Ticker API returned updates but no SPONSORED ad')
          console.log(`   Total updates: ${data.updates?.length || 0}`)
          if (data.updates && data.updates.length > 0) {
            console.log(`   Update types: ${data.updates.map((u: any) => u.type).join(', ')}`)
          }
        }
      } else {
        console.log(`❌ Ticker API returned error: ${response.status}`)
        const error = await response.text()
        console.log(`   Error: ${error}`)
      }
    } catch (apiError: any) {
      console.log('⚠️  Could not test API endpoint (server may not be running)')
      console.log(`   Error: ${apiError.message}`)
    }

  } catch (error: any) {
    console.error('\n❌ Error testing ticker ads:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

testTickerAds()
