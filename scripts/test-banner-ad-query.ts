import { prisma } from '../lib/db/prisma'

async function testBannerAdQuery() {
  console.log('\n=== Testing BANNER Ad Query ===\n')

  try {
    // Test 1: Find any BANNER ad
    console.log('Test 1: Finding any BANNER ad...')
    const anyBanner = await prisma.advertisement.findFirst({
      where: {
        type: 'BANNER',
      },
    })
    console.log('Result:', anyBanner ? `Found: ${anyBanner.id} - ${anyBanner.title}` : 'NOT FOUND')

    // Test 2: Find ACTIVE BANNER ad
    console.log('\nTest 2: Finding ACTIVE BANNER ad...')
    const activeBanner = await prisma.advertisement.findFirst({
      where: {
        type: 'BANNER',
        status: 'ACTIVE',
      },
    })
    console.log('Result:', activeBanner ? `Found: ${activeBanner.id} - ${activeBanner.title}` : 'NOT FOUND')

    // Test 3: Find ACTIVE BANNER ad with creativeUrl
    console.log('\nTest 3: Finding ACTIVE BANNER ad with creativeUrl...')
    const allActiveBanners = await prisma.advertisement.findMany({
      where: {
        type: 'BANNER',
        status: 'ACTIVE',
      },
    })
    const bannerWithImage = allActiveBanners.find(ad => ad.creativeUrl !== null)
    console.log('Result:', bannerWithImage ? `Found: ${bannerWithImage.id} - ${bannerWithImage.title}` : 'NOT FOUND')
    if (bannerWithImage) {
      console.log('  Creative URL:', bannerWithImage.creativeUrl)
      console.log('  Target URL:', bannerWithImage.targetUrl)
      console.log('  Start Date:', bannerWithImage.startDate)
      console.log('  End Date:', bannerWithImage.endDate)
    }

    // Test 4: Count all BANNER ads
    console.log('\nTest 4: Counting all BANNER ads...')
    const count = await prisma.advertisement.count({
      where: {
        type: 'BANNER',
      },
    })
    console.log(`Total BANNER ads: ${count}`)

    // Test 5: List all BANNER ads
    console.log('\nTest 5: Listing all BANNER ads...')
    const allBanners = await prisma.advertisement.findMany({
      where: {
        type: 'BANNER',
      },
      select: {
        id: true,
        title: true,
        status: true,
        creativeUrl: true,
        startDate: true,
        endDate: true,
      },
    })
    console.log(`Found ${allBanners.length} BANNER ads:`)
    allBanners.forEach((ad, i) => {
      console.log(`  ${i + 1}. ${ad.title} (${ad.status}) - Has image: ${!!ad.creativeUrl}`)
    })

  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

testBannerAdQuery()
