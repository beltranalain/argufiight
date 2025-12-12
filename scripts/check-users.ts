import { prisma } from '../lib/db/prisma'

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        isAdmin: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log('\n=== Users in Database ===')
    console.log(`Total users: ${users.length}\n`)

    if (users.length === 0) {
      console.log('⚠️  No users found in database!')
      console.log('You need to create a user first:')
      console.log('  1. Go to /signup to create an account')
      console.log('  2. Or run: npm run create-admin')
      return
    }

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.email})`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Admin: ${user.isAdmin ? 'Yes' : 'No'}`)
      console.log(`   Created: ${user.createdAt.toLocaleString()}`)
      console.log('')
    })
  } catch (error) {
    console.error('Error checking users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()





