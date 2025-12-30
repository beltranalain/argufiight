import { prisma } from '../lib/db/prisma'

async function checkDebate() {
  try {
    // Search for the debate by topic
    const topic = 'Was Ed Reed a better safety at Miami than Sean Taylor?'
    
    const debate = await prisma.debate.findFirst({
      where: {
        topic: {
          contains: 'Ed Reed',
          mode: 'insensitive'
        }
      },
      include: {
        challenger: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        opponent: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    })

    if (!debate) {
      console.log('❌ Debate not found')
      return
    }

    console.log('\n📊 Debate Details:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`ID: ${debate.id}`)
    console.log(`Topic: ${debate.topic}`)
    console.log(`Status: ${debate.status}`)
    console.log(`Category: ${debate.category}`)
    console.log(`Challenge Type: ${debate.challengeType}`)
    console.log(`Is Private: ${debate.isPrivate}`)
    console.log(`Created At: ${debate.createdAt}`)
    console.log(`\nChallenger:`)
    console.log(`  - Username: ${debate.challenger.username}`)
    console.log(`  - ID: ${debate.challenger.id}`)
    console.log(`\nOpponent:`)
    if (debate.opponent) {
      console.log(`  - Username: ${debate.opponent.username}`)
      console.log(`  - ID: ${debate.opponent.id}`)
    } else {
      console.log(`  - None (waiting for opponent)`)
    }
    console.log(`\nInvited User IDs: ${debate.invitedUserIds || 'None'}`)
    
    // Check if it would appear in various queries
    console.log('\n🔍 Visibility Check:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // Check for challenger's debates
    const challengerDebates = await prisma.debate.findMany({
      where: {
        OR: [
          { challengerId: debate.challengerId },
          { opponentId: debate.challengerId }
        ]
      },
      select: { id: true, status: true, topic: true }
    })
    console.log(`\n✅ Visible to challenger (${debate.challenger.username}):`)
    console.log(`   Total debates: ${challengerDebates.length}`)
    const challengerWaiting = challengerDebates.filter(d => d.status === 'WAITING')
    console.log(`   WAITING debates: ${challengerWaiting.length}`)
    const found = challengerWaiting.find(d => d.id === debate.id)
    console.log(`   This debate included: ${found ? '✅ YES' : '❌ NO'}`)
    
    // Check for opponent's debates (if opponent exists)
    if (debate.opponentId) {
      const opponentDebates = await prisma.debate.findMany({
        where: {
          OR: [
            { challengerId: debate.opponentId },
            { opponentId: debate.opponentId }
          ]
        },
        select: { id: true, status: true, topic: true }
      })
      console.log(`\n✅ Visible to opponent (${debate.opponent?.username}):`)
      console.log(`   Total debates: ${opponentDebates.length}`)
      const opponentWaiting = opponentDebates.filter(d => d.status === 'WAITING')
      console.log(`   WAITING debates: ${opponentWaiting.length}`)
      const foundOpp = opponentWaiting.find(d => d.id === debate.id)
      console.log(`   This debate included: ${foundOpp ? '✅ YES' : '❌ NO'}`)
    }
    
    // Check WAITING debates query
    const waitingDebates = await prisma.debate.findMany({
      where: { status: 'WAITING' },
      select: { id: true, topic: true, challengeType: true, invitedUserIds: true }
    })
    console.log(`\n📋 All WAITING debates: ${waitingDebates.length}`)
    const foundWaiting = waitingDebates.find(d => d.id === debate.id)
    console.log(`   This debate included: ${foundWaiting ? '✅ YES' : '❌ NO'}`)
    
    // Check if it's a DIRECT challenge and who can see it
    if (debate.challengeType === 'DIRECT' && debate.invitedUserIds) {
      console.log(`\n🎯 DIRECT Challenge Analysis:`)
      try {
        const invitedIds = JSON.parse(debate.invitedUserIds) as string[]
        console.log(`   Invited user IDs: ${invitedIds.join(', ')}`)
        
        for (const invitedId of invitedIds) {
          const invitedUser = await prisma.user.findUnique({
            where: { id: invitedId },
            select: { username: true, id: true }
          })
          if (invitedUser) {
            console.log(`   - ${invitedUser.username} (${invitedId}) can see this challenge`)
          } else {
            console.log(`   - User ${invitedId} not found`)
          }
        }
      } catch (e) {
        console.log(`   ⚠️  Error parsing invitedUserIds: ${e}`)
      }
    }
    
    console.log('\n')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDebate()







