import { PrismaClient } from '@prisma/client'
import { generateInitialVerdicts } from '../lib/verdicts/generate-initial'

const prisma = new PrismaClient()

async function triggerVerdictGeneration() {
  try {
    // Find the completed debate without verdicts
    const debate = await prisma.debate.findFirst({
      where: {
        status: 'COMPLETED',
        opponent: {
          isAI: true,
        },
        verdicts: {
          none: {},
        },
      },
      select: {
        id: true,
        topic: true,
        challenger: {
          select: {
            username: true,
          },
        },
        opponent: {
          select: {
            username: true,
          },
        },
      },
    })

    if (!debate) {
      console.log('No completed debate found without verdicts.')
      return
    }

    console.log(`\n=== Triggering Verdict Generation ===`)
    console.log(`Debate: "${debate.topic}"`)
    console.log(`Challenger: ${debate.challenger.username}`)
    console.log(`Opponent: ${debate.opponent?.username}`)
    console.log(`\nGenerating verdicts...`)

    await generateInitialVerdicts(debate.id)

    console.log(`\n✅ Verdict generation completed!`)
  } catch (error) {
    console.error('❌ Error generating verdicts:', error)
  } finally {
    await prisma.$disconnect()
  }
}

triggerVerdictGeneration()

