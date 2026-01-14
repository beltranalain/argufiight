import { prisma } from '../lib/db/prisma.js'

async function checkOffer() {
  try {
    const offer = await prisma.offer.findFirst({
      where: { creatorId: 'cec34454-8ca4-416e-9715-0aebee4c7731' },
      select: {
        id: true,
        status: true,
        amount: true,
      },
    })
    
    if (offer) {
      console.log('Offer found:')
      console.log(`  ID: ${offer.id}`)
      console.log(`  Status: ${offer.status}`)
      console.log(`  Amount: $${Number(offer.amount)}`)
    } else {
      console.log('No offer found')
    }
  } catch (error: any) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkOffer()
