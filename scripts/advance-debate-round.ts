import { advanceDebateRound, checkDebateRound } from '../lib/debates/round-advancement'

async function main() {
  const debateId = process.argv[2]

  if (!debateId) {
    console.log('Usage: npx tsx scripts/advance-debate-round.ts <debate-id>')
    console.log('Example: npx tsx scripts/advance-debate-round.ts 151cc66a-8c0c-4e68-a8f8-97894e0fc63c')
    process.exit(1)
  }

  try {
    console.log(`\n=== Checking Debate Round ===`)
    console.log(`Debate ID: ${debateId}\n`)

    const checkResult = await checkDebateRound(debateId)
    console.log('Current Status:')
    console.log(JSON.stringify(checkResult, null, 2))
    console.log('')

    if (checkResult.deadline && new Date(checkResult.deadline) <= new Date()) {
      console.log('Round deadline has passed. Advancing round...\n')
      const advanceResult = await advanceDebateRound(debateId)
      console.log('Advance Result:')
      console.log(JSON.stringify(advanceResult, null, 2))
    } else {
      console.log('Round deadline has not passed yet. No action needed.')
    }
  } catch (error: any) {
    console.error('Error:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    await import('../lib/db/prisma').then(m => m.prisma.$disconnect())
    process.exit(0)
  }
}

main()
