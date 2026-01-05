import { prisma } from '../lib/db/prisma'

async function checkVerdicts(debateId: string) {
  try {
    console.log(`\n🔍 Checking verdicts for debate: ${debateId}\n`)

    const debate = await prisma.debate.findUnique({
      where: { id: debateId },
        include: {
          verdicts: {
            include: {
              judge: {
                select: {
                  id: true,
                  name: true,
                  emoji: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
    })

    if (!debate) {
      console.log('❌ Debate not found')
      return
    }

    console.log('✅ Debate found!')
    console.log(`   Topic: ${debate.topic}`)
    console.log(`   Status: ${debate.status}`)
    console.log(`   Current Round: ${debate.currentRound}/${debate.totalRounds}`)
    console.log(`   Created: ${new Date(debate.createdAt).toLocaleString()}`)
    console.log(`   Updated: ${new Date(debate.updatedAt).toLocaleString()}`)
    if (debate.endedAt) {
      console.log(`   Ended: ${new Date(debate.endedAt).toLocaleString()}`)
    }

    console.log(`\n📊 Verdicts (${debate.verdicts.length} total):`)
    if (debate.verdicts.length === 0) {
      console.log('   ⚠️  No verdicts found!')
      
      if (debate.status === 'COMPLETED') {
        console.log(`\n   Debate is COMPLETED but has no verdicts.`)
        console.log(`   Verdicts should have been generated automatically.`)
      } else if (debate.status === 'ACTIVE') {
        console.log(`\n   Debate is still ACTIVE.`)
        if (debate.currentRound >= debate.totalRounds) {
          console.log(`   ⚠️  Debate is in final round but still active.`)
          console.log(`   Both participants may have submitted - debate should be completed.`)
        }
      }
    } else {
      debate.verdicts.forEach((verdict, idx) => {
        console.log(`\n   ${idx + 1}. Judge: ${verdict.judge?.name || 'Unknown'} ${verdict.judge?.emoji || ''}`)
        console.log(`      Decision: ${verdict.decision}`)
        console.log(`      Challenger Score: ${verdict.challengerScore}`)
        console.log(`      Opponent Score: ${verdict.opponentScore}`)
        console.log(`      Created: ${new Date(verdict.createdAt).toLocaleString()}`)
        if (verdict.reasoning) {
          console.log(`      Reasoning: ${verdict.reasoning.substring(0, 100)}...`)
        }
      })
    }

    // Check statements count
    const statementCount = await prisma.statement.count({
      where: { debateId: debateId },
    })
    console.log(`\n📝 Total Statements: ${statementCount}`)

    // Check if debate should have verdicts
    if (debate.status === 'COMPLETED' && debate.verdicts.length === 0) {
      console.log(`\n❌ ISSUE: Debate is COMPLETED but has no verdicts!`)
      console.log(`   This indicates verdict generation failed or wasn't triggered.`)
    }

    return debate
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

const debateId = process.argv[2]

if (!debateId) {
  console.error('Usage: npx tsx scripts/check-debate-verdicts.ts <debateId>')
  process.exit(1)
}

checkVerdicts(debateId)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
