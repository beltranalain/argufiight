/**
 * Check when AI should accept the current challenge
 */

import { prisma } from '../lib/db/prisma'

async function checkAIAcceptTiming() {
  try {
    // Find AI users
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
      console.log('❌ No active AI users found')
      return
    }

    console.log(`\n📊 Active AI Users (${aiUsers.length}):\n`)
    aiUsers.forEach((aiUser) => {
      const delayMs = aiUser.aiResponseDelay || 3600000 // Default 1 hour
      const delayMinutes = Math.floor(delayMs / 60000)
      const delayHours = Math.floor(delayMs / 3600000)
      console.log(`  - ${aiUser.username}`)
      console.log(`    Delay: ${delayMs}ms (${delayMinutes} minutes / ${delayHours} hours)`)
      console.log(`    ID: ${aiUser.id}\n`)
    })

    // Find the WAITING challenge created by kubancane
    const waitingChallenge = await prisma.debate.findFirst({
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
    })

    if (!waitingChallenge) {
      console.log('❌ No WAITING OPEN challenges found')
      return
    }

    console.log(`\n📋 Current WAITING Challenge:\n`)
    console.log(`  Topic: "${waitingChallenge.topic}"`)
    console.log(`  ID: ${waitingChallenge.id}`)
    console.log(`  Challenger: ${waitingChallenge.challenger.username}`)
    console.log(`  Created: ${waitingChallenge.createdAt}`)
    
    const now = new Date()
    const createdAt = new Date(waitingChallenge.createdAt)
    const ageMs = now.getTime() - createdAt.getTime()
    const ageMinutes = Math.floor(ageMs / 60000)
    const ageHours = Math.floor(ageMs / 3600000)
    
    console.log(`  Age: ${ageMs}ms (${ageMinutes} minutes / ${ageHours} hours)`)
    console.log(`  Current time: ${now.toISOString()}`)
    console.log(`  Created time: ${createdAt.toISOString()}\n`)

    console.log(`\n🤖 AI Acceptance Analysis:\n`)
    
    for (const aiUser of aiUsers) {
      const delayMs = aiUser.aiResponseDelay || 3600000 // Default 1 hour
      const cutoffTime = new Date(now.getTime() - delayMs)
      const shouldAccept = createdAt <= cutoffTime
      
      console.log(`  ${aiUser.username}:`)
      console.log(`    Required delay: ${Math.floor(delayMs / 60000)} minutes`)
      console.log(`    Challenge created: ${createdAt.toISOString()}`)
      console.log(`    Cutoff time: ${cutoffTime.toISOString()}`)
      console.log(`    Should accept: ${shouldAccept ? '✅ YES' : '❌ NO'}`)
      
      if (!shouldAccept) {
        const timeUntilAccept = delayMs - ageMs
        const minutesUntil = Math.floor(timeUntilAccept / 60000)
        console.log(`    Will accept in: ~${minutesUntil} minutes`)
      }
      console.log('')
    }

    // Check if challenge meets all criteria for acceptance
    console.log(`\n✅ Acceptance Criteria Check:\n`)
    console.log(`  1. Status = WAITING: ${waitingChallenge.status === 'WAITING' ? '✅' : '❌'}`)
    console.log(`  2. Type = OPEN: ${waitingChallenge.challengeType === 'OPEN' ? '✅' : '❌'}`)
    console.log(`  3. No opponent: ${waitingChallenge.opponentId === null ? '✅' : '❌'}`)
    console.log(`  4. Challenger is not AI: ${!aiUsers.some(ai => ai.id === waitingChallenge.challengerId) ? '✅' : '❌'}`)
    
    const oldestDelay = Math.min(...aiUsers.map(ai => ai.aiResponseDelay || 3600000))
    const shouldBeAccepted = ageMs >= oldestDelay
    console.log(`  5. Age >= minimum delay: ${shouldBeAccepted ? '✅' : '❌'} (${Math.floor(ageMs / 60000)}m >= ${Math.floor(oldestDelay / 60000)}m)`)
    
    if (shouldBeAccepted && waitingChallenge.status === 'WAITING' && waitingChallenge.challengeType === 'OPEN' && waitingChallenge.opponentId === null) {
      console.log(`\n⚠️  This challenge SHOULD have been accepted by now!`)
      console.log(`   The AI auto-accept cron job may not be running, or there's an issue.`)
    }
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkAIAcceptTiming()
