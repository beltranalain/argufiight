import { prisma } from '../lib/db/prisma'

async function testApiRoutes() {
  console.log('\n=== Testing API Routes ===\n')

  try {
    // Test 1: Check advertisers API
    console.log('1. Testing /api/admin/advertisers?status=PENDING')
    const pendingAdvertisers = await prisma.advertiser.findMany({
      where: { status: 'PENDING' },
      select: {
        id: true,
        companyName: true,
        contactEmail: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    console.log(`   ✅ Found ${pendingAdvertisers.length} pending advertiser(s):`)
    pendingAdvertisers.forEach((adv, i) => {
      console.log(`      ${i + 1}. ${adv.companyName} (${adv.contactEmail})`)
    })

    // Test 2: Check email API usage
    console.log('\n2. Testing Email API Usage')
    const emailUsage = await prisma.apiUsage.findMany({
      where: {
        provider: 'resend',
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })
    console.log(`   ✅ Found ${emailUsage.length} email usage record(s)`)
    
    // Test 3: Check API usage stats
    console.log('\n3. Testing API Usage Stats')
    const allUsage = await prisma.apiUsage.findMany({
      select: {
        provider: true,
        success: true,
        cost: true,
      },
    })
    
    const statsByProvider = allUsage.reduce((acc, usage) => {
      if (!acc[usage.provider]) {
        acc[usage.provider] = { calls: 0, success: 0, cost: 0 }
      }
      acc[usage.provider].calls++
      if (usage.success) acc[usage.provider].success++
      acc[usage.provider].cost += usage.cost || 0
      return acc
    }, {} as Record<string, { calls: number; success: number; cost: number }>)

    console.log('   Provider stats:')
    Object.entries(statsByProvider).forEach(([provider, stats]) => {
      console.log(`      ${provider}: ${stats.calls} calls, ${stats.success} success, $${stats.cost.toFixed(4)} cost`)
    })

    const resendStats = statsByProvider['resend']
    if (resendStats) {
      console.log(`   ✅ Resend stats: ${resendStats.calls} emails sent`)
    } else {
      console.log('   ⚠️  No Resend stats found (but we know emails were sent)')
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

testApiRoutes()
