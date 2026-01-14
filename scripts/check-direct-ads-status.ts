import { prisma } from '../lib/db/prisma'

async function checkDirectAds() {
  try {
    console.log('\n=== Checking Direct Ads Status ===\n')

    const now = new Date()

    // Check all ads
    const allAds = await prisma.advertisement.findMany({
      orderBy: { createdAt: 'desc' },
    })

    console.log(`Total ads in database: ${allAds.length}\n`)

    // Check by type
    const bannerAds = allAds.filter(ad => ad.type === 'BANNER')
    const sponsoredAds = allAds.filter(ad => ad.type === 'SPONSORED_DEBATE')
    const inFeedAds = allAds.filter(ad => ad.type === 'IN_FEED')

    console.log(`BANNER ads: ${bannerAds.length}`)
    console.log(`SPONSORED_DEBATE ads: ${sponsoredAds.length}`)
    console.log(`IN_FEED ads: ${inFeedAds.length}\n`)

    // Check active ads with images
    const activeBanner = bannerAds.filter(ad => 
      ad.status === 'ACTIVE' && 
      ad.creativeUrl &&
      (!ad.startDate || new Date(ad.startDate) <= now) &&
      (!ad.endDate || new Date(ad.endDate) >= now)
    )

    const activeSponsored = sponsoredAds.filter(ad => 
      ad.status === 'ACTIVE' && 
      ad.creativeUrl &&
      (!ad.startDate || new Date(ad.startDate) <= now) &&
      (!ad.endDate || new Date(ad.endDate) >= now)
    )

    const activeInFeed = inFeedAds.filter(ad => 
      ad.status === 'ACTIVE' && 
      ad.creativeUrl &&
      (!ad.startDate || new Date(ad.startDate) <= now) &&
      (!ad.endDate || new Date(ad.endDate) >= now)
    )

    console.log(`✅ Active BANNER ads (with image): ${activeBanner.length}`)
    activeBanner.forEach(ad => {
      console.log(`   - ${ad.title} (ID: ${ad.id})`)
      console.log(`     Status: ${ad.status}, Has Image: ${!!ad.creativeUrl}`)
      console.log(`     Dates: ${ad.startDate ? new Date(ad.startDate).toLocaleDateString() : 'No start'} - ${ad.endDate ? new Date(ad.endDate).toLocaleDateString() : 'No end'}`)
    })

    console.log(`\n✅ Active SPONSORED_DEBATE ads (with image): ${activeSponsored.length}`)
    activeSponsored.forEach(ad => {
      console.log(`   - ${ad.title} (ID: ${ad.id})`)
      console.log(`     Status: ${ad.status}, Has Image: ${!!ad.creativeUrl}`)
      console.log(`     Dates: ${ad.startDate ? new Date(ad.startDate).toLocaleDateString() : 'No start'} - ${ad.endDate ? new Date(ad.endDate).toLocaleDateString() : 'No end'}`)
    })

    console.log(`\n✅ Active IN_FEED ads (with image): ${activeInFeed.length}`)
    activeInFeed.forEach(ad => {
      console.log(`   - ${ad.title} (ID: ${ad.id})`)
      console.log(`     Status: ${ad.status}, Has Image: ${!!ad.creativeUrl}`)
      console.log(`     Dates: ${ad.startDate ? new Date(ad.startDate).toLocaleDateString() : 'No start'} - ${ad.endDate ? new Date(ad.endDate).toLocaleDateString() : 'No end'}`)
    })

    // Check for issues
    console.log(`\n=== Issues Found ===\n`)

    const sponsoredWithoutImage = sponsoredAds.filter(ad => ad.status === 'ACTIVE' && !ad.creativeUrl)
    const inFeedWithoutImage = inFeedAds.filter(ad => ad.status === 'ACTIVE' && !ad.creativeUrl)

    if (sponsoredWithoutImage.length > 0) {
      console.log(`⚠️  SPONSORED_DEBATE ads without images (ACTIVE): ${sponsoredWithoutImage.length}`)
      sponsoredWithoutImage.forEach(ad => {
        console.log(`   - ${ad.title} (ID: ${ad.id}) - Missing creativeUrl`)
      })
    }

    if (inFeedWithoutImage.length > 0) {
      console.log(`⚠️  IN_FEED ads without images (ACTIVE): ${inFeedWithoutImage.length}`)
      inFeedWithoutImage.forEach(ad => {
        console.log(`   - ${ad.title} (ID: ${ad.id}) - Missing creativeUrl`)
      })
    }

    const sponsoredInactive = sponsoredAds.filter(ad => ad.status !== 'ACTIVE')
    const inFeedInactive = inFeedAds.filter(ad => ad.status !== 'ACTIVE')

    if (sponsoredInactive.length > 0) {
      console.log(`\n⚠️  SPONSORED_DEBATE ads not ACTIVE: ${sponsoredInactive.length}`)
      sponsoredInactive.forEach(ad => {
        console.log(`   - ${ad.title} (ID: ${ad.id}) - Status: ${ad.status}`)
      })
    }

    if (inFeedInactive.length > 0) {
      console.log(`\n⚠️  IN_FEED ads not ACTIVE: ${inFeedInactive.length}`)
      inFeedInactive.forEach(ad => {
        console.log(`   - ${ad.title} (ID: ${ad.id}) - Status: ${ad.status}`)
      })
    }

    console.log(`\n=== Summary ===\n`)
    console.log(`Total ads: ${allAds.length}`)
    console.log(`Active with images:`)
    console.log(`  - BANNER: ${activeBanner.length}`)
    console.log(`  - SPONSORED_DEBATE: ${activeSponsored.length}`)
    console.log(`  - IN_FEED: ${activeInFeed.length}`)

  } catch (error: any) {
    console.error('Error checking ads:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDirectAds()
