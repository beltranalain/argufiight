import { prisma } from '../lib/db/prisma.js'

async function listAdTables() {
  try {
    // Try to query each model to see what exists
    const models = [
      'advertisement',
      'advertisements', 
      'campaign',
      'campaigns',
      'offer',
      'offers',
      'adContract',
      'adContracts',
      'advertiser',
      'advertisers',
    ]
    
    console.log('Checking for advertisement-related tables...\n')
    
    for (const model of models) {
      try {
        const count = await (prisma as any)[model]?.count()
        if (count !== undefined) {
          console.log(`✓ ${model}: ${count} records`)
        }
      } catch (e: any) {
        // Model doesn't exist or can't be accessed
      }
    }
    
  } catch (error: any) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

listAdTables()
