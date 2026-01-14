import { prisma } from '../lib/db/prisma'

async function testAdminAdvertisersAPI() {
  console.log('\n=== Testing Admin Advertisers API Logic ===\n')

  try {
    // Test 1: Check if new columns exist
    console.log('1. Checking database schema...')
    const schemaInfo = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'advertisers'
      AND column_name IN ('contact_phone', 'company_size', 'monthly_ad_budget', 'marketing_goals');
    ` as { column_name: string }[]

    const newFieldsExist = schemaInfo.length === 4
    console.log(`   New fields exist: ${newFieldsExist}`)
    if (newFieldsExist) {
      console.log(`   Found columns: ${schemaInfo.map(c => c.column_name).join(', ')}`)
    } else {
      console.warn(`   ⚠️  Only found ${schemaInfo.length}/4 new columns`)
      console.log(`   Found: ${schemaInfo.map(c => c.column_name).join(', ') || 'none'}`)
    }

    // Test 2: Try querying with all fields
    console.log('\n2. Testing query with all fields...')
    try {
      const allFields = await prisma.advertiser.findMany({
        where: { status: 'PENDING' },
        select: {
          id: true,
          companyName: true,
          industry: true,
          contactEmail: true,
          contactName: true,
          website: true,
          businessEIN: true,
          status: true,
          createdAt: true,
          approvedAt: true,
          rejectionReason: true,
          suspendedAt: true,
          suspensionReason: true,
          contactPhone: true,
          companySize: true,
          monthlyAdBudget: true,
          marketingGoals: true,
        },
        take: 1,
      })
      console.log('   ✅ Query with all fields succeeded')
      console.log(`   Found ${allFields.length} pending advertiser(s)`)
    } catch (error: any) {
      console.error('   ❌ Query with all fields failed:', error.message)
      console.error('   Error code:', error.code)
      console.error('   Error name:', error.name)

      // Test 3: Try querying with basic fields only
      console.log('\n3. Testing query with basic fields only...')
      try {
        const basicFields = await prisma.advertiser.findMany({
          where: { status: 'PENDING' },
          select: {
            id: true,
            companyName: true,
            industry: true,
            contactEmail: true,
            contactName: true,
            website: true,
            businessEIN: true,
            status: true,
            createdAt: true,
            approvedAt: true,
            rejectionReason: true,
            suspendedAt: true,
            suspensionReason: true,
          },
          take: 1,
        })
        console.log('   ✅ Query with basic fields succeeded')
        console.log(`   Found ${basicFields.length} pending advertiser(s)`)
      } catch (fallbackError: any) {
        console.error('   ❌ Query with basic fields also failed:', fallbackError.message)
        console.error('   Error code:', fallbackError.code)
        console.error('   Error name:', fallbackError.name)
      }
    }

    // Test 4: Count advertisers by status
    console.log('\n4. Counting advertisers by status...')
    const counts = {
      pending: await prisma.advertiser.count({ where: { status: 'PENDING' } }),
      approved: await prisma.advertiser.count({ where: { status: 'APPROVED' } }),
      rejected: await prisma.advertiser.count({ where: { status: 'REJECTED' } }),
    }
    console.log(`   PENDING: ${counts.pending}`)
    console.log(`   APPROVED: ${counts.approved}`)
    console.log(`   REJECTED: ${counts.rejected}`)

  } catch (error: any) {
    console.error('\n❌ Test failed with error:', error.message)
    console.error('Error details:', {
      code: error.code,
      name: error.name,
      stack: error.stack,
    })
  } finally {
    await prisma.$disconnect()
  }
}

testAdminAdvertisersAPI()
