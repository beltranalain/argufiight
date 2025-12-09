/**
 * Script to manually generate verdicts for an expired debate
 * Usage: npx tsx scripts/generate-verdict-for-expired-debate.ts <debateId>
 */

import { prisma } from '../lib/db/prisma'
import { generateInitialVerdicts } from '../lib/verdicts/generate-initial'

async function generateVerdictForDebate(debateId: string) {
  try {
    console.log(`🔄 Generating verdicts for debate: ${debateId}\n`)

    // Check if debate exists
    const debate = await prisma.debate.findUnique({
      where: { id: debateId },
      select: {
        id: true,
        topic: true,
        status: true,
        currentRound: true,
        totalRounds: true,
        roundDeadline: true,
        endedAt: true,
      },
    })

    if (!debate) {
      console.error('❌ Debate not found')
      process.exit(1)
    }

    console.log('📋 Debate Info:')
    console.log(`   Topic: ${debate.topic}`)
    console.log(`   Status: ${debate.status}`)
    console.log(`   Round: ${debate.currentRound}/${debate.totalRounds}`)
    console.log(`   Round Deadline: ${debate.roundDeadline}`)
    console.log(`   Ended At: ${debate.endedAt}\n`)

    // Check if debate is completed
    if (debate.status !== 'COMPLETED' && debate.status !== 'VERDICT_READY') {
      console.log('⚠️  Debate is not completed. Updating status to COMPLETED...')
      await prisma.debate.update({
        where: { id: debateId },
        data: {
          status: 'COMPLETED',
          endedAt: new Date(),
          roundDeadline: null,
        },
      })
      console.log('✅ Debate status updated to COMPLETED\n')
    }

    // Check for expired statements
    const statements = await prisma.statement.findMany({
      where: { debateId },
      select: {
        round: true,
        content: true,
        author: {
          select: { username: true },
        },
      },
    })

    const expiredStatements = statements.filter(s => 
      s.content.includes('[No submission - Time expired]') || 
      s.content.includes('Time expired')
    )

    if (expiredStatements.length > 0) {
      console.log(`⚠️  Found ${expiredStatements.length} expired submission(s):`)
      expiredStatements.forEach(s => {
        console.log(`   Round ${s.round}: ${s.author.username} - ${s.content.substring(0, 50)}...`)
      })
      console.log('')
    }

    // Generate verdicts
    console.log('🤖 Generating AI verdicts...\n')
    await generateInitialVerdicts(debateId)

    // Check if verdicts were created
    const verdicts = await prisma.verdict.findMany({
      where: { debateId },
      include: {
        judge: {
          select: { name: true },
        },
      },
    })

    console.log(`\n✅ Verdict generation complete!`)
    console.log(`   Created ${verdicts.length} verdict(s):`)
    verdicts.forEach(v => {
      console.log(`   - ${v.judge.name}: ${v.decision} (${v.challengerScore} vs ${v.opponentScore})`)
    })

    // Update debate status
    await prisma.debate.update({
      where: { id: debateId },
      data: {
        status: 'VERDICT_READY',
      },
    })
    console.log('\n✅ Debate status updated to VERDICT_READY')
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Get debate ID from command line
const debateId = process.argv[2]

if (!debateId) {
  console.error('Usage: npx tsx scripts/generate-verdict-for-expired-debate.ts <debateId>')
  process.exit(1)
}

generateVerdictForDebate(debateId)
  .then(() => {
    console.log('\n✨ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })

