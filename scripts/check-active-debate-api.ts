import { prisma } from '../lib/db/prisma'

async function checkActiveDebate() {
  const user = await prisma.user.findUnique({
    where: { username: 'kubancane' },
    select: { id: true, username: true },
  })

  if (!user) {
    console.log('❌ User not found')
    return
  }

  console.log(`\n📊 Checking active debates for: ${user.username} (${user.id})\n`)

  // Check what the database has
  const debates = await prisma.debate.findMany({
    where: {
      OR: [
        { challengerId: user.id },
        { opponentId: user.id },
      ],
      status: 'ACTIVE',
    },
    include: {
      challenger: { select: { username: true } },
      opponent: { select: { username: true } },
    },
  })

  console.log(`✅ Active debates in database: ${debates.length}\n`)
  
  debates.forEach((d, i) => {
    console.log(`${i + 1}. "${d.topic.substring(0, 60)}${d.topic.length > 60 ? '...' : ''}"`)
    console.log(`   ID: ${d.id}`)
    console.log(`   Status: ${d.status}`)
    console.log(`   Challenger: ${d.challenger.username}`)
    console.log(`   Opponent: ${d.opponent?.username || 'None'}`)
    console.log(`   Created: ${d.createdAt}`)
    if (d.startedAt) {
      console.log(`   Started: ${d.startedAt}`)
    }
    console.log('')
  })

  // Check what the API query would return
  const apiQuery = await prisma.debate.findMany({
    where: {
      OR: [
        { challengerId: user.id },
        { opponentId: user.id },
      ],
      status: {
        in: ['ACTIVE', 'WAITING'],
      },
    },
    select: {
      id: true,
      topic: true,
      status: true,
      challengerId: true,
      opponentId: true,
    },
  })

  console.log(`\n📡 API query would return: ${apiQuery.length} debates\n`)
  apiQuery.forEach((d, i) => {
    console.log(`${i + 1}. ID: ${d.id}`)
    console.log(`   Topic: "${d.topic.substring(0, 50)}..."`)
    console.log(`   Status: ${d.status}`)
    console.log(`   Is Challenger: ${d.challengerId === user.id}`)
    console.log(`   Is Opponent: ${d.opponentId === user.id}`)
    console.log('')
  })

  await prisma.$disconnect()
}

checkActiveDebate()
