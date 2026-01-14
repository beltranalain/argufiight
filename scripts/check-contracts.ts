import { prisma } from '../lib/db/prisma.js'

async function checkContracts() {
  try {
    console.log('\n=== Checking Contracts ===\n')
    
    const contracts = await prisma.adContract.findMany({
      include: {
        advertiser: {
          select: { companyName: true, contactEmail: true },
        },
        creator: {
          select: { username: true },
        },
        campaign: {
          select: { name: true },
        },
      },
      orderBy: { signedAt: 'desc' },
    })
    
    console.log(`Total Contracts: ${contracts.length}\n`)
    
    if (contracts.length === 0) {
      console.log('⚠️  No contracts found in database')
    } else {
      contracts.forEach((contract, index) => {
        console.log(`Contract ${index + 1}:`)
        console.log(`  ID: ${contract.id}`)
        console.log(`  Status: ${contract.status}`)
        console.log(`  Advertiser: ${contract.advertiser.companyName}`)
        console.log(`  Creator: @${contract.creator.username}`)
        console.log(`  Campaign: ${contract.campaign.name}`)
        console.log(`  Placement: ${contract.placement}`)
        console.log(`  Total Amount: $${Number(contract.totalAmount)}`)
        console.log(`  Escrow Held: ${contract.escrowHeld}`)
        console.log(`  Start Date: ${contract.startDate.toISOString()}`)
        console.log(`  End Date: ${contract.endDate.toISOString()}`)
        console.log('')
      })
      
      const byStatus = contracts.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      console.log('Summary by Status:')
      Object.entries(byStatus).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`)
      })
    }
    
  } catch (error: any) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkContracts()
