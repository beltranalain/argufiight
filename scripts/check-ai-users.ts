/**
 * Check for AI users in the database
 */

import { prisma } from '../lib/db/prisma'

async function checkAIUsers() {
  try {
    const aiUsers = await prisma.user.findMany({
      where: { isAI: true },
      select: {
        id: true,
        username: true,
        email: true,
        isAI: true,
        aiPersonality: true,
        aiPaused: true,
      },
    })

    console.log('\n📊 AI Users Report:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`Total AI Users: ${aiUsers.length}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    if (aiUsers.length === 0) {
      console.log('⚠️  No AI users found in the database')
      console.log('   Use the "Create AI User" button on the admin page to create one\n')
    } else {
      aiUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.username} (${user.email})`)
        console.log(`   Personality: ${user.aiPersonality || 'Not set'}`)
        console.log(`   Paused: ${user.aiPaused ? 'Yes' : 'No'}`)
        console.log('')
      })
    }
  } catch (error) {
    console.error('Error checking AI users:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkAIUsers()
