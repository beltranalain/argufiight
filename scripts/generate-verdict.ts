import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function generateVerdictForDebate(debateId: string) {
  try {
    console.log(`Generating verdicts for debate: ${debateId}`)
    
    const response = await fetch('http://localhost:3000/api/verdicts/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ debateId }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Error:', result.error)
      return
    }

    console.log('✅ Verdicts generated successfully!')
    console.log(`- ${result.verdicts} verdicts created`)
    console.log(`- Debate status: ${result.debate.status}`)
    console.log(`- Winner: ${result.debate.winnerId ? 'Determined' : 'Tie'}`)
  } catch (error) {
    console.error('Failed to generate verdicts:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Get debate ID from command line argument
const debateId = process.argv[2]

if (!debateId) {
  console.log('Usage: tsx scripts/generate-verdict.ts <debate-id>')
  console.log('\nTo find your debate ID:')
  console.log('1. Go to your debate page in the browser')
  console.log('2. Look at the URL: /debate/[debate-id]')
  console.log('3. Copy the debate ID and run this script')
  process.exit(1)
}

generateVerdictForDebate(debateId)






