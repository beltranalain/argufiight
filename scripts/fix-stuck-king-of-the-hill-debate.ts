/**
 * Fix stuck King of the Hill debate by generating verdicts
 * Usage: npx tsx scripts/fix-stuck-king-of-the-hill-debate.ts <debateId>
 */

import { PrismaClient } from '@prisma/client'
import { processKingOfTheHillDebateCompletion } from '../lib/tournaments/king-of-the-hill'

const prisma = new PrismaClient()

async function fixStuckDebate(debateId: string) {
  try {
    console.log(`\n=== Fixing Stuck King of the Hill Debate ===`)
    console.log(`Debate ID: ${debateId}\n`)

    // Get debate info
    const debate = await prisma.debate.findUnique({
      where: { id: debateId },
      include: {
        tournamentMatch: {
          include: {
            round: {
              include: {
                tournament: {
                  select: {
                    id: true,
                    name: true,
                    format: true,
                  },
                },
              },
            },
          },
        },
        participants: {
          include: {
            user: {
              select: {
                username: true,
              },
            },
          },
        },
      },
    })

    if (!debate) {
      console.error('❌ Debate not found')
      return
    }

    console.log(`Topic: ${debate.topic}`)
    console.log(`Status: ${debate.status}`)
    console.log(`Challenge Type: ${debate.challengeType}`)

    if (debate.tournamentMatch) {
      console.log(`Tournament: ${debate.tournamentMatch.round.tournament.name}`)
      console.log(`Format: ${debate.tournamentMatch.round.tournament.format}`)
      console.log(`Round: ${debate.tournamentMatch.round.roundNumber}`)
    }

    console.log(`\nParticipants:`)
    debate.participants.forEach((p) => {
      console.log(`  - ${p.user.username}`)
    })

    // Check existing verdicts
    const verdictCount = await prisma.verdict.count({
      where: { debateId },
    })
    console.log(`\nExisting verdicts: ${verdictCount}`)

    if (verdictCount > 0) {
      console.log('⚠️  Verdicts already exist. This will process completion/advancement.')
    }

    // Process King of the Hill completion (this will generate verdicts if needed)
    console.log(`\nProcessing King of the Hill completion...`)
    await processKingOfTheHillDebateCompletion(debateId)

    // Check verdicts again
    const newVerdictCount = await prisma.verdict.count({
      where: { debateId },
    })
    console.log(`\nVerdicts after processing: ${newVerdictCount}`)

    // Get updated debate status
    const updatedDebate = await prisma.debate.findUnique({
      where: { id: debateId },
      select: {
        status: true,
      },
    })

    console.log(`\n✅ Processing complete!`)
    console.log(`Debate status: ${updatedDebate?.status}`)
    console.log(`Verdicts generated: ${newVerdictCount}`)
  } catch (error: any) {
    console.error('❌ Error fixing debate:', error.message)
    console.error(error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

// Get debate ID from command line
const debateId = process.argv[2]

if (!debateId) {
  console.error('Usage: npx tsx scripts/fix-stuck-king-of-the-hill-debate.ts <debateId>')
  console.error('Example: npx tsx scripts/fix-stuck-king-of-the-hill-debate.ts c4b494aa-b73d-46fd-90fa-e68db3616e0e')
  process.exit(1)
}

fixStuckDebate(debateId)
