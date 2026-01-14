import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function test() {
  try {
    console.log('Testing Prisma models...')
    
    // Check if creatorTaxInfo exists
    if ('creatorTaxInfo' in prisma) {
      console.log('✅ creatorTaxInfo model exists')
      
      // Try to find a record
      const count = await (prisma.creatorTaxInfo as any).count()
      console.log(`Found ${count} creatorTaxInfo records`)
      
      // Try to find by creatorId
      const testUserId = 'cec34454-8ca4-416e-9715-0aebee4c7731'
      const taxInfo = await (prisma.creatorTaxInfo as any).findUnique({
        where: { creatorId: testUserId },
      })
      
      if (taxInfo) {
        console.log('✅ Found tax info:', {
          id: taxInfo.id,
          w9Submitted: taxInfo.w9Submitted,
          yearlyEarnings: taxInfo.yearlyEarnings,
        })
      } else {
        console.log('⚠️ No tax info found for user')
      }
    } else {
      console.log('❌ creatorTaxInfo model does NOT exist in Prisma client')
      console.log('Available models:', Object.keys(prisma).filter(key => !key.startsWith('_')))
    }
    
    // Check if taxForm1099 exists
    if ('taxForm1099' in prisma) {
      console.log('✅ taxForm1099 model exists')
    } else {
      console.log('❌ taxForm1099 model does NOT exist in Prisma client')
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

test()
