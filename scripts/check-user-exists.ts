import { prisma } from '../lib/db/prisma'

async function checkUserExists(userId: string) {
  try {
    console.log('Checking user with ID:', userId)
    console.log('ID type:', typeof userId)
    console.log('ID length:', userId.length)
    console.log('ID format (UUID check):', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId))

    // Try exact match
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        isAdmin: true,
        createdAt: true,
      },
    })

    if (user) {
      console.log('✅ User found:', user)
      return user
    }

    console.log('❌ User not found with exact ID match')

    // Try case-insensitive search
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
      },
      take: 10,
    })

    console.log('\nFirst 10 users in database:')
    allUsers.forEach((u, i) => {
      console.log(`${i + 1}. ID: ${u.id}, Username: ${u.username}, Email: ${u.email}`)
      if (u.id.toLowerCase() === userId.toLowerCase()) {
        console.log('   ⚠️  Case mismatch detected!')
      }
    })

    // Check if ID is similar
    const similarUsers = allUsers.filter(u => 
      u.id.toLowerCase().includes(userId.toLowerCase()) || 
      userId.toLowerCase().includes(u.id.toLowerCase())
    )

    if (similarUsers.length > 0) {
      console.log('\n⚠️  Similar user IDs found:')
      similarUsers.forEach(u => {
        console.log(`  - ${u.id} (${u.username})`)
      })
    }

    return null
  } catch (error) {
    console.error('Error checking user:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Get user ID from command line argument
const userId = process.argv[2]

if (!userId) {
  console.error('Usage: npx tsx scripts/check-user-exists.ts <userId>')
  process.exit(1)
}

checkUserExists(userId)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
