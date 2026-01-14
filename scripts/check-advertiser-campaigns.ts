import { prisma } from '../lib/db/prisma.js'

async function checkCampaigns(email: string) {
  try {
    const normalizedEmail = email.toLowerCase().trim()
    
    console.log(`\n=== Checking Campaigns ===`)
    console.log(`Advertiser Email: ${normalizedEmail}\n`)
    
    const advertiser = await prisma.advertiser.findUnique({
      where: { contactEmail: normalizedEmail },
      select: {
        id: true,
        contactEmail: true,
        companyName: true,
        status: true,
      },
    })
    
    if (!advertiser) {
      console.log('❌ Advertiser not found')
      return
    }
    
    console.log('✅ Advertiser found!')
    console.log(`  ID: ${advertiser.id}`)
    console.log(`  Company: ${advertiser.companyName}`)
    console.log(`  Status: ${advertiser.status}\n`)
    
    const campaigns = await prisma.campaign.findMany({
      where: {
        advertiserId: advertiser.id,
      },
      select: {
        id: true,
        name: true,
        status: true,
        budget: true,
        startDate: true,
        endDate: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    
    console.log(`📊 Campaigns Found: ${campaigns.length}\n`)
    
    if (campaigns.length === 0) {
      console.log('⚠️  No campaigns found for this advertiser')
    } else {
      campaigns.forEach((campaign, index) => {
        console.log(`Campaign ${index + 1}:`)
        console.log(`  ID: ${campaign.id}`)
        console.log(`  Name: ${campaign.name}`)
        console.log(`  Status: ${campaign.status}`)
        console.log(`  Budget: $${campaign.budget}`)
        console.log(`  Start Date: ${campaign.startDate.toISOString()}`)
        console.log(`  End Date: ${campaign.endDate.toISOString()}`)
        
        const isAvailable = 
          campaign.status === 'APPROVED' ||
          campaign.status === 'PENDING_REVIEW' ||
          campaign.status === 'ACTIVE'
        
        console.log(`  Available for Offers: ${isAvailable ? '✅ YES' : '❌ NO'}`)
        console.log('')
      })
    }
    
  } catch (error: any) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

const email = process.argv[2]
if (!email) {
  console.log('Usage: npx tsx scripts/check-advertiser-campaigns.ts <email>')
  process.exit(1)
}

checkCampaigns(email)
