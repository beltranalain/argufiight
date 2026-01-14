import { prisma } from '../lib/db/prisma'

async function checkAdTypes() {
  try {
    console.log('\n=== Checking All Ad Types ===\n')

    const now = new Date()

    // Check BANNER ads
    const bannerAds = await prisma.advertisement.findMany({
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
    })

    console.log(`✅ BANNER ads: ${bannerAds.length}`)
    bannerAds.forEach(ad => {
      console.log(`   - ${ad.title} (ID: ${ad.id})`)
      console.log(`     Displayed on: Profile pages (PROFILE_BANNER placement)`)
    })

    // Check SPONSORED_DEBATE ads
    const sponsoredAds = await prisma.advertisement.findMany({
      where: {
        type: 'SPONSORED_DEBATE',
        status: 'ACTIVE',
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: { gte: now } },
          { startDate: null, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: null },
        ],
      },
    })

    console.log(`\n✅ SPONSORED_DEBATE ads: ${sponsoredAds.length}`)
    sponsoredAds.forEach(ad => {
      console.log(`   - ${ad.title} (ID: ${ad.id})`)
      console.log(`     Displayed on: Debate pages after verdict (POST_DEBATE placement)`)
      console.log(`     ⚠️  Only shows if you're a participant in the debate`)
    })

    // Check IN_FEED ads
    const inFeedAds = await prisma.advertisement.findMany({
      where: {
        type: 'IN_FEED',
        status: 'ACTIVE',
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: { gte: now } },
          { startDate: null, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: null },
        ],
      },
    })

    console.log(`\n✅ IN_FEED ads: ${inFeedAds.length}`)
    inFeedAds.forEach(ad => {
      console.log(`   - ${ad.title} (ID: ${ad.id})`)
      console.log(`     ⚠️  NOT YET IMPLEMENTED - Need to add to feed pages`)
      console.log(`     Should display on: Trending topics, debates list, dashboard feed`)
    })

    console.log('\n=== Where to See Each Ad Type ===\n')
    console.log('1. BANNER ads:')
    console.log('   → Visit any profile page: /profile or /profile/[userId]')
    console.log('   → Ad appears at the top of the profile\n')

    console.log('2. SPONSORED_DEBATE ads:')
    console.log('   → Complete a debate (as challenger or opponent)')
    console.log('   → After verdict is shown, ad appears below')
    console.log('   → Only visible to debate participants\n')

    console.log('3. IN_FEED ads:')
    console.log('   → ⚠️  NOT YET IMPLEMENTED')
    console.log('   → Need to add AdDisplay component to:')
    console.log('     - Dashboard feed')
    console.log('     - Trending topics page')
    console.log('     - Debates list page\n')

  } catch (error: any) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdTypes()
