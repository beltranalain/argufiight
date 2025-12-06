import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDatabase() {
  try {
    console.log('🔍 Checking database state...\n')

    // Check if we can connect
    await prisma.$connect()
    console.log('✅ Connected to database\n')

    // Check users
    const userCount = await prisma.user.count()
    console.log(`👥 Users: ${userCount}`)

    // Check debates
    const debateCount = await prisma.debate.count()
    console.log(`💬 Debates: ${debateCount}`)

    // Check categories
    const categoryCount = await prisma.category.count()
    console.log(`📁 Categories: ${categoryCount}`)

    // Check judges
    const judgeCount = await prisma.judge.count()
    console.log(`⚖️  Judges: ${judgeCount}`)

    // Check subscriptions
    const subscriptionCount = await prisma.userSubscription.count()
    console.log(`💳 Subscriptions: ${subscriptionCount}`)

    // Check advertisers
    const advertiserCount = await prisma.advertiser.count()
    console.log(`📢 Advertisers: ${advertiserCount}`)

    // Check campaigns
    const campaignCount = await prisma.campaign.count()
    console.log(`🎯 Campaigns: ${campaignCount}`)

    // Check promo codes
    const promoCount = await prisma.promoCode.count()
    console.log(`🎟️  Promo Codes: ${promoCount}`)

    console.log('\n📊 Summary:')
    if (userCount === 0 && debateCount === 0 && categoryCount === 0) {
      console.log('⚠️  Database appears to be EMPTY (no data)')
      console.log('   Tables exist but have no records')
    } else {
      console.log('✅ Database has some data')
    }

  } catch (error: any) {
    console.error('❌ Error checking database:', error.message)
    if (error.message.includes("Can't reach database")) {
      console.error('\n⚠️  Cannot connect to database!')
      console.error('   Check your DATABASE_URL in .env.local')
    }
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()

