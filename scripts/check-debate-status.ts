import { prisma } from '../lib/db/prisma'

async function checkDebate() {
  const debate = await prisma.debate.findUnique({
    where: { id: 'd31d6dd2-cb12-43f2-9136-a78686ccdfb5' },
    include: {
      challenger: { select: { username: true } },
      opponent: { select: { username: true } },
    },
  })
  
  if (debate) {
    console.log('✅ Debate Status:', debate.status)
    console.log('   Challenger:', debate.challenger.username)
    console.log('   Opponent:', debate.opponent?.username || 'None')
    console.log('   Topic:', debate.topic.substring(0, 60))
    console.log('   Created:', debate.createdAt)
    if (debate.startedAt) {
      console.log('   Started:', debate.startedAt)
    }
  } else {
    console.log('❌ Debate not found')
  }
  
  await prisma.$disconnect()
}

checkDebate()
