import { prisma } from '../lib/db/prisma.js'
import { DebateStatus } from '@prisma/client'

async function advanceDebate(debateId: string) {
  const debate = await prisma.debate.findUnique({
    where: { id: debateId },
  })

  if (!debate) {
    throw new Error(`Debate ${debateId} not found`)
  }

  console.log(`Current Round: ${debate.currentRound}/${debate.totalRounds}`)
  console.log(`Status: ${debate.status}`)
  console.log(`Round Deadline: ${debate.roundDeadline}`)

  if (debate.status !== 'ACTIVE') {
    console.log(`Debate is ${debate.status}, cannot advance`)
    return
  }

  const now = new Date()
  if (debate.roundDeadline && debate.roundDeadline > now) {
    console.log(`Round deadline has not passed yet (${Math.floor((debate.roundDeadline.getTime() - now.getTime()) / 60000)} minutes remaining)`)
    return
  }

  if (debate.currentRound >= debate.totalRounds) {
    await prisma.debate.update({
      where: { id: debateId },
      data: {
        status: DebateStatus.COMPLETED,
        endedAt: now,
        roundDeadline: null,
      },
    })
    console.log('Debate completed!')
  } else {
    const nextRound = debate.currentRound + 1
    const nextDeadline = new Date(now.getTime() + debate.roundDuration)
    await prisma.debate.update({
      where: { id: debateId },
      data: {
        currentRound: nextRound,
        roundDeadline: nextDeadline,
      },
    })
    console.log(`Advanced to round ${nextRound}! New deadline: ${nextDeadline}`)
  }
}

const debateId = process.argv[2]
if (!debateId) {
  console.log('Usage: npx tsx scripts/fix-debate.ts <debate-id>')
  process.exit(1)
}

advanceDebate(debateId)
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
