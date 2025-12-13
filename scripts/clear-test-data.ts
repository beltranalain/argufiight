import { prisma } from '../lib/db/prisma'

const TEST_USERS = ['test@test.com', 'abc@abmo.com']

async function clearTestData() {
  try {
    console.log('\n=== Clearing Test Data ===\n')

    // Find test users
    const users = await prisma.user.findMany({
      where: {
        email: { in: TEST_USERS.map(e => e.toLowerCase()) },
      },
      select: {
        id: true,
        email: true,
        username: true,
      },
    })

    if (users.length === 0) {
      console.log('❌ No test users found!')
      return
    }

    console.log(`✅ Found ${users.length} test user(s):`)
    users.forEach(u => console.log(`   - ${u.username} (${u.email})`))

    // Find advertiser for abc@abmo.com
    const advertiser = await prisma.advertiser.findUnique({
      where: { contactEmail: 'abc@abmo.com' },
      select: { id: true },
    })

    const userIds = users.map(u => u.id)
    let offersDeleted = { count: 0 }
    let campaignsDeleted = { count: 0 }
    let contractsDeleted = { count: 0 }
    let offersForUsersDeleted = { count: 0 }

    if (advertiser) {
      console.log('\n🗑️  Clearing advertiser data...')
      
      // Delete offers
      offersDeleted = await prisma.offer.deleteMany({
        where: { advertiserId: advertiser.id },
      })
      console.log(`   ✅ Deleted ${offersDeleted.count} offers`)

      // Delete campaigns
      campaignsDeleted = await prisma.campaign.deleteMany({
        where: { advertiserId: advertiser.id },
      })
      console.log(`   ✅ Deleted ${campaignsDeleted.count} campaigns`)
    }

    // Delete contracts for test users
    contractsDeleted = await prisma.adContract.deleteMany({
      where: {
        OR: [
          { creatorId: { in: userIds } },
          ...(advertiser ? [{ advertiserId: advertiser.id }] : []),
        ],
      },
    })
    console.log(`   ✅ Deleted ${contractsDeleted.count} contracts`)

    // Delete offers for test users
    offersForUsersDeleted = await prisma.offer.deleteMany({
      where: {
        creatorId: { in: userIds },
      },
    })
    console.log(`   ✅ Deleted ${offersForUsersDeleted.count} offers to creators`)

    // Reset testuser (test@test.com)
    const testUser = users.find(u => u.email === 'test@test.com')
    if (testUser) {
      console.log('\n🔄 Resetting testuser...')
      
      // Set account creation date to 4 months ago to meet age requirement
      const fourMonthsAgo = new Date()
      fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4)

      await prisma.user.update({
        where: { id: testUser.id },
        data: {
          eloRating: 2000,
          isCreator: false,
          creatorStatus: null,
          creatorSince: null,
          // Reset debate stats to meet minimum requirements
          totalDebates: 10, // Minimum for creator eligibility
          debatesWon: 5,
          debatesLost: 3,
          debatesTied: 2,
          // Set account creation date to 4 months ago
          createdAt: fourMonthsAgo,
          // Reset ad slot availability
          profileBannerAvailable: true,
          postDebateAvailable: true,
          debateWidgetAvailable: true,
          // Reset pricing
          profileBannerPrice: null,
          postDebatePrice: null,
          debateWidgetPrice: null,
          // Reset stats
          avgMonthlyViews: 0,
          avgDebateViews: 0,
          followerCount: 0,
          profileVisits: 0,
        },
      })

      const accountAgeMonths = Math.floor((new Date().getTime() - fourMonthsAgo.getTime()) / (1000 * 60 * 60 * 24 * 30))
      console.log(`   ✅ Reset testuser:`)
      console.log(`      - ELO: 2000 (GOLD tier)`)
      console.log(`      - isCreator: false`)
      console.log(`      - creatorStatus: null`)
      console.log(`      - totalDebates: 10`)
      console.log(`      - Account age: ${accountAgeMonths} months`)
      console.log(`      - Account created: ${fourMonthsAgo.toISOString().split('T')[0]}`)
    }

    // Reset advertiser user (abc@abmo.com)
    const advertiserUser = users.find(u => u.email === 'abc@abmo.com')
    if (advertiserUser) {
      console.log('\n🔄 Resetting advertiser user...')
      
      await prisma.user.update({
        where: { id: advertiserUser.id },
        data: {
          isCreator: false,
          creatorStatus: null,
          creatorSince: null,
        },
      })

      console.log(`   ✅ Reset advertiser user creator status`)
    }

    // Delete creator tax info for test users
    const taxInfoDeleted = await prisma.creatorTaxInfo.deleteMany({
      where: {
        creatorId: { in: userIds },
      },
    })
    console.log(`\n   ✅ Deleted ${taxInfoDeleted.count} creator tax info records`)

    console.log('\n✅ Test data cleared successfully!')
    console.log('\n📋 Summary:')
    console.log(`   - Offers deleted: ${offersDeleted.count + offersForUsersDeleted.count}`)
    console.log(`   - Campaigns deleted: ${campaignsDeleted.count}`)
    console.log(`   - Contracts deleted: ${contractsDeleted.count}`)
    console.log(`   - Tax info deleted: ${taxInfoDeleted.count}`)
    console.log(`   - testuser ELO set to: 2000`)
    console.log(`   - testuser isCreator: false`)
    console.log(`   - testuser totalDebates: 10`)
    
    console.log('\n🎯 Next steps:')
    console.log('   1. Login as test@test.com')
    console.log('   2. Go to creator dashboard')
    console.log('   3. Enable creator mode (should be eligible with ELO 2000)')
    console.log('   4. Creator status should be GOLD (ELO >= 2000)')
    
  } catch (error: any) {
    console.error('\n❌ Error clearing test data:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

clearTestData()

