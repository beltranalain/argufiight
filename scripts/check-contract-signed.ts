import { prisma } from '../lib/db/prisma.js'

async function checkContractSignedAt() {
  try {
    const contract = await prisma.adContract.findFirst({
      where: { creatorId: 'cec34454-8ca4-416e-9715-0aebee4c7731' },
      select: {
        id: true,
        status: true,
        signedAt: true,
        
      },
    })
    
    if (contract) {
      console.log('Contract details:')
      console.log(`  ID: ${contract.id}`)
      console.log(`  Status: ${contract.status}`)
      console.log(`  SignedAt: ${contract.signedAt}`)
      console.log(`  CreatedAt: ${contract.createdAt}`)
    }
  } catch (error: any) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkContractSignedAt()
