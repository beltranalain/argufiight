import { prisma } from '../lib/db/prisma'

async function clearCreatorTaxData() {
  const userEmail = 'beltranalain@yahoo.com'
  
  console.log('Finding user:', userEmail)
  
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { id: true, username: true },
  })
  
  if (!user) {
    console.log('User not found')
    process.exit(1)
  }
  
  console.log('Found user:', user.username, user.id)
  
  // Find tax info
  const taxInfo = await prisma.creatorTaxInfo.findUnique({
    where: { creatorId: user.id },
    include: {
      taxForms1099: true,
    },
  })
  
  if (!taxInfo) {
    console.log('No tax info found for this user')
    process.exit(0)
  }
  
  console.log('Found tax info:', taxInfo.id)
  console.log('Found', taxInfo.taxForms1099.length, '1099 forms')
  
  // Delete all 1099 forms first (due to foreign key constraint)
  if (taxInfo.taxForms1099.length > 0) {
    console.log('Deleting 1099 forms...')
    await prisma.taxForm1099.deleteMany({
      where: { creatorTaxInfoId: taxInfo.id },
    })
    console.log('Deleted', taxInfo.taxForms1099.length, '1099 forms')
  }
  
  // Delete tax info
  console.log('Deleting tax info...')
  await prisma.creatorTaxInfo.delete({
    where: { id: taxInfo.id },
  })
  console.log('Deleted tax info')
  
  console.log('\n✅ Successfully cleared all creator tax data for', userEmail)
  
  await prisma.$disconnect()
}

clearCreatorTaxData().catch(console.error)
