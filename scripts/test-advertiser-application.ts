import { prisma } from '../lib/db/prisma'

async function testAdvertiserApplication() {
  try {
    console.log('\n=== Testing Advertiser Application ===\n')

    // Check if new columns exist
    console.log('Checking database schema...')
    const testAdvertiser = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'advertisers' 
      AND column_name IN ('contact_phone', 'company_size', 'monthly_ad_budget', 'marketing_goals')
    ` as any[]

    const hasNewFields = testAdvertiser.length > 0
    console.log(`New fields exist: ${hasNewFields}`)
    if (hasNewFields) {
      console.log(`Found ${testAdvertiser.length} new field(s):`, testAdvertiser.map((c: any) => c.column_name))
    } else {
      console.log('⚠️  New fields NOT found - migration needed')
    }

    // Check existing advertisers
    const count = await prisma.advertiser.count()
    console.log(`\nTotal advertisers in database: ${count}`)

    const pending = await prisma.advertiser.count({
      where: { status: 'PENDING' },
    })
    console.log(`Pending advertisers: ${pending}`)

    // Test creating an advertiser (will be cleaned up)
    console.log('\n--- Testing Application Creation ---')
    try {
      const testData = {
        companyName: 'Test Company ' + Date.now(),
        website: 'https://test.com',
        industry: 'Technology',
        contactName: 'Test User',
        contactEmail: `test-${Date.now()}@example.com`,
        businessEIN: null,
        status: 'PENDING' as const,
      }

      // Try with new fields first
      try {
        const advertiser = await prisma.advertiser.create({
          data: {
            ...testData,
            contactPhone: '+1-555-123-4567',
            companySize: 'SMALL',
            monthlyAdBudget: '500_2000',
            marketingGoals: 'Test marketing goals',
          },
        })
        console.log('✅ Created with all fields:', advertiser.id)
        
        // Clean up
        await prisma.advertiser.delete({ where: { id: advertiser.id } })
        console.log('✅ Test advertiser deleted')
      } catch (error: any) {
        if (error.message?.includes('contact_phone') || 
            error.message?.includes('company_size') || 
            error.message?.includes('monthly_ad_budget') || 
            error.message?.includes('marketing_goals')) {
          console.log('⚠️  New fields not available, testing without them...')
          
          const advertiser = await prisma.advertiser.create({
            data: testData,
          })
          console.log('✅ Created without new fields:', advertiser.id)
          
          // Clean up
          await prisma.advertiser.delete({ where: { id: advertiser.id } })
          console.log('✅ Test advertiser deleted')
        } else {
          throw error
        }
      }
    } catch (error: any) {
      console.error('❌ Failed to create test advertiser:', error.message)
    }

    console.log('\n✅ Test complete!')
  } catch (error: any) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testAdvertiserApplication()
