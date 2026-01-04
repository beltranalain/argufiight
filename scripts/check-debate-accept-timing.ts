import { prisma } from '../lib/db/prisma'

async function checkDebateAcceptTiming() {
  try {
    // Find the debate by topic
    const topic = "Music streaming platforms should prioritize human curation over algorithmic recommendations."
    
    const debate = await prisma.debate.findFirst({
      where: {
        topic: {
          contains: topic.substring(0, 50), // Search for first part of topic
        },
        status: 'WAITING',
        challengeType: 'OPEN',
        opponentId: null,
      },
      include: {
        challenger: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!debate) {
      console.log('❌ No open debate found with that topic')
      console.log('\nSearching for any open debates...')
      
      const allOpenDebates = await prisma.debate.findMany({
        where: {
          status: 'WAITING',
          challengeType: 'OPEN',
          opponentId: null,
        },
        include: {
          challenger: {
            select: {
              username: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      })

      if (allOpenDebates.length === 0) {
        console.log('No open debates found.')
      } else {
        console.log(`\nFound ${allOpenDebates.length} open debate(s):\n`)
        allOpenDebates.forEach((d, i) => {
          console.log(`${i + 1}. "${d.topic.substring(0, 60)}..."`)
          console.log(`   Created by: ${d.challenger.username}`)
          console.log(`   Created at: ${new Date(d.createdAt).toLocaleString()}`)
          console.log('')
        })
      }
      return
    }

    console.log('\n📊 Debate Found:\n')
    console.log(`Topic: "${debate.topic}"`)
    console.log(`Challenger: ${debate.challenger.username}`)
    console.log(`Created at: ${new Date(debate.createdAt).toLocaleString()}`)
    console.log(`Status: ${debate.status}`)
    console.log(`Challenge Type: ${debate.challengeType}`)

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
      },
    })

    if (aiUsers.length === 0) {
      console.log('\n⚠️ No active AI users found. The debate will not be accepted automatically.')
      return
    }

    console.log(`\n\n🤖 AI Users Available: ${aiUsers.length}\n`)

    const now = new Date()
    const debateAge = now.getTime() - new Date(debate.createdAt).getTime()
    const debateAgeMinutes = Math.floor(debateAge / 60000)
    const debateAgeSeconds = Math.floor((debateAge % 60000) / 1000)

    console.log(`⏰ Debate Age: ${debateAgeMinutes} minute(s) ${debateAgeSeconds} second(s)\n`)

    // Check each AI user
    for (const aiUser of aiUsers) {
      const delayMs = aiUser.aiResponseDelay || 3600000 // Default 1 hour
      const delayMinutes = Math.floor(delayMs / 60000)
      const delayHours = Math.floor(delayMs / 3600000)
      
      console.log(`\n${aiUser.username}:`)
      console.log(`  Auto-accept delay: ${delayMs}ms (${delayMinutes} minutes / ${delayHours} hours)`)

      if (debateAge >= delayMs) {
        // AI should accept now
        const overdueMs = debateAge - delayMs
        const overdueMinutes = Math.floor(overdueMs / 60000)
        console.log(`  ✅ ELIGIBLE NOW (${overdueMinutes} minute(s) overdue)`)
        console.log(`  The AI should accept this challenge immediately on the next cron run.`)
      } else {
        // Calculate time remaining
        const timeRemainingMs = delayMs - debateAge
        const timeRemainingMinutes = Math.floor(timeRemainingMs / 60000)
        const timeRemainingSeconds = Math.floor((timeRemainingMs % 60000) / 1000)
        
        console.log(`  ⏳ Time remaining: ${timeRemainingMinutes} minute(s) ${timeRemainingSeconds} second(s)`)
        
        const estimatedAcceptTime = new Date(now.getTime() + timeRemainingMs)
        console.log(`  📅 Estimated accept time: ${estimatedAcceptTime.toLocaleString()}`)
      }
    }

    console.log('\n\n💡 Note:')
    console.log('   - The AI auto-accept cron runs every 5 minutes (or when debates are created/viewed)')
    console.log('   - Once the delay period passes, the AI will accept on the next cron check')
    console.log('   - After acceptance, the AI will respond within the same delay period when it\'s their turn\n')

  } catch (error: any) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDebateAcceptTiming()
