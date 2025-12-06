import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkAIAcceptTime() {
  try {
    // Get all active AI users
    const aiUsers = await prisma.user.findMany({
      where: {
        isAI: true,
        aiPaused: false,
      },
      select: {
        id: true,
        username: true,
        aiResponseDelay: true,
        aiPersonality: true,
      },
    })

    console.log('\n=== AI Users ===')
    if (aiUsers.length === 0) {
      console.log('No active AI users found.')
    } else {
      aiUsers.forEach((user) => {
        const delayMs = user.aiResponseDelay || 3600000 // Default 1 hour
        const delayMinutes = Math.floor(delayMs / 60000)
        const delayHours = Math.floor(delayMs / 3600000)
        const delayDisplay = delayHours > 0 
          ? `${delayHours} hour${delayHours > 1 ? 's' : ''}`
          : `${delayMinutes} minute${delayMinutes > 1 ? 's' : ''}`
        
        console.log(`\n${user.username}:`)
        console.log(`  - Personality: ${user.aiPersonality || 'N/A'}`)
        console.log(`  - Auto-accept delay: ${delayDisplay} (${delayMs}ms)`)
      })
    }

    // Get all open debates
    const openDebates = await prisma.debate.findMany({
      where: {
        status: 'WAITING',
        opponentId: null,
        challengeType: 'OPEN',
      },
      select: {
        id: true,
        topic: true,
        challengerId: true,
        createdAt: true,
        challenger: {
          select: {
            username: true,
            isAI: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    console.log('\n=== Open Debates ===')
    if (openDebates.length === 0) {
      console.log('No open debates found.')
    } else {
      const now = new Date()
      
      openDebates.forEach((debate) => {
        const createdAt = new Date(debate.createdAt)
        const ageMs = now.getTime() - createdAt.getTime()
        const ageMinutes = Math.floor(ageMs / 60000)
        const ageHours = Math.floor(ageMs / 3600000)
        const ageDisplay = ageHours > 0
          ? `${ageHours}h ${Math.floor((ageMs % 3600000) / 60000)}m`
          : `${ageMinutes}m`
        
        console.log(`\n"${debate.topic}"`)
        console.log(`  - Challenger: ${debate.challenger.username}${debate.challenger.isAI ? ' (AI)' : ''}`)
        console.log(`  - Created: ${createdAt.toLocaleString()}`)
        console.log(`  - Age: ${ageDisplay}`)
        
        // Check if any AI user can accept this
        if (aiUsers.length > 0) {
          console.log(`  - AI Acceptance Status:`)
          aiUsers.forEach((aiUser) => {
            const delayMs = aiUser.aiResponseDelay || 3600000
            const timeUntilAccept = delayMs - ageMs
            const canAccept = timeUntilAccept <= 0
            
            if (debate.challengerId === aiUser.id) {
              console.log(`    • ${aiUser.username}: Cannot accept (own challenge)`)
            } else if (canAccept) {
              console.log(`    • ${aiUser.username}: ✅ READY TO ACCEPT (${Math.abs(Math.floor(timeUntilAccept / 60000))}m overdue)`)
            } else {
              const remainingMinutes = Math.floor(timeUntilAccept / 60000)
              const remainingHours = Math.floor(remainingMinutes / 60)
              const remainingDisplay = remainingHours > 0
                ? `${remainingHours}h ${remainingMinutes % 60}m`
                : `${remainingMinutes}m`
              console.log(`    • ${aiUser.username}: ⏳ ${remainingDisplay} remaining`)
            }
          })
        }
      })
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAIAcceptTime()

