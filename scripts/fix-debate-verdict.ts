import { prisma } from '../lib/db/prisma.js'

async function fixDebate() {
  try {
    const debateId = '151cc66a-8c0c-4e68-a8f8-97894e0fc63c'
    
    const debate = await prisma.debate.findUnique({
      where: { id: debateId },
      include: {
        statements: {
          select: { round: true },
        },
      },
    })
    
    if (!debate) {
      console.log('Debate not found')
      return
    }
    
    const round1Statements = debate.statements.filter(s => s.round === 1)
    console.log(`Round 1 statements: ${round1Statements.length}`)
    console.log(`Total statements: ${debate.statements.length}`)
    console.log(`Status: ${debate.status}`)
    console.log(`Verdict reached: ${debate.verdictReached}`)
    
    if (round1Statements.length === 0 && debate.status === 'COMPLETED') {
      await prisma.debate.update({
        where: { id: debateId },
        data: {
          verdictReached: true,
          verdictDate: new Date(),
        },
      })
      console.log('✅ Set verdictReached to true - no statements to judge')
    }
  } catch (error: any) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

fixDebate()
