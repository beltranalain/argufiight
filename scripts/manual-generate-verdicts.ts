import { generateInitialVerdicts } from '../lib/verdicts/generate-initial'

async function manualGenerateVerdicts(debateId: string) {
  try {
    console.log(`\n🔍 Generating verdicts for debate: ${debateId}\n`)

    console.log('📊 Starting verdict generation...')
    await generateInitialVerdicts(debateId)
    
    console.log('\n✅ Verdicts generated successfully!')
  } catch (error: any) {
    console.error('\n❌ Error generating verdicts:', error.message)
    console.error('Stack:', error.stack)
    throw error
  }
}

const debateId = process.argv[2]

if (!debateId) {
  console.error('Usage: npx tsx scripts/manual-generate-verdicts.ts <debateId>')
  process.exit(1)
}

manualGenerateVerdicts(debateId)
  .then(() => {
    console.log('\n✅ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
