import { prisma } from '../lib/db/prisma.js'

async function checkUser() {
  try {
    const email = 'beltranalain@yahoo.com'
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        username: true,
        email: true,
        isCreator: true,
      },
    })
    
    if (user) {
      console.log('User found:')
      console.log(`  ID: ${user.id}`)
      console.log(`  Username: ${user.username}`)
      console.log(`  Email: ${user.email}`)
      console.log(`  Is Creator: ${user.isCreator}`)
      
      // Check contracts for this user
      const contracts = await prisma.adContract.findMany({
        where: { creatorId: user.id },
        select: {
          id: true,
          status: true,
          creatorId: true,
        },
      })
      
      console.log(`\nContracts for this user: ${contracts.length}`)
      contracts.forEach(c => {
        console.log(`  Contract ${c.id}: Status ${c.status}`)
      })
    } else {
      console.log('User not found')
    }
  } catch (error: any) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkUser()
