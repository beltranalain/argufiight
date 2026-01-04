import { prisma } from '../lib/db/prisma'

async function completeDebateWithAI() {
  try {
    // Find the user
    const user = await prisma.user.findFirst({
      where: {
        username: {
          contains: 'kuban',
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        username: true,
      },
    })

    if (!user) {
      console.log('❌ User not found')
      return
    }

    console.log(`\n📊 Completing debate for: ${user.username}\n`)

    // Find active debates with AI opponent
    const activeDebates = await prisma.debate.findMany({
      where: {
        OR: [
          { challengerId: user.id },
          { opponentId: user.id },
        ],
        status: 'ACTIVE',
      },
      include: {
        challenger: {
          select: {
            id: true,
            username: true,
            isAI: true,
          },
        },
        opponent: {
          select: {
            id: true,
            username: true,
            isAI: true,
          },
        },
        statements: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (activeDebates.length === 0) {
      console.log('❌ No active debates found')
      return
    }

    const debate = activeDebates[0]
    console.log(`📋 Debate: "${debate.topic.substring(0, 60)}${debate.topic.length > 60 ? '...' : ''}"`)
    console.log(`   ID: ${debate.id}`)
    console.log(`   Current Round: ${debate.currentRound}/${debate.totalRounds}`)
    console.log(`   Status: ${debate.status}\n`)

    // Find AI user
    const aiUser = debate.challenger.isAI ? debate.challenger : (debate.opponent?.isAI ? debate.opponent : null)
    
    if (!aiUser) {
      console.log('❌ No AI user in this debate')
      return
    }

    console.log(`🤖 AI User: ${aiUser.username}\n`)

    // Keep triggering responses until debate is complete
    let maxIterations = 20 // Safety limit
    let iteration = 0

    while (debate.status === 'ACTIVE' && iteration < maxIterations) {
      iteration++
      console.log(`\n--- Iteration ${iteration} ---`)
      
      // Trigger AI response generation
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const response = await fetch(`${baseUrl}/api/cron/ai-generate-responses`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`✅ AI Response triggered: ${data.responses || 0} response(s) generated`)
      } else {
        console.log(`❌ Failed to trigger AI response: ${response.status}`)
      }

      // Wait a moment for the response to be processed
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Refresh debate status
      const updatedDebate = await prisma.debate.findUnique({
        where: { id: debate.id },
        select: {
          id: true,
          status: true,
          currentRound: true,
          totalRounds: true,
          statements: {
            where: {
              round: debate.currentRound,
            },
            select: {
              authorId: true,
              round: true,
            },
          },
        },
      })

      if (!updatedDebate) {
        console.log('❌ Debate not found')
        break
      }

      console.log(`   Status: ${updatedDebate.status}`)
      console.log(`   Round: ${updatedDebate.currentRound}/${updatedDebate.totalRounds}`)
      console.log(`   Statements in current round: ${updatedDebate.statements.length}`)

      if (updatedDebate.status !== 'ACTIVE') {
        console.log(`\n🎉 Debate completed! Status: ${updatedDebate.status}`)
        break
      }

      // Check if we need to wait for user input
      const currentRoundStatements = updatedDebate.statements.filter(s => s.round === updatedDebate.currentRound)
      const challengerStatement = currentRoundStatements.find(s => s.authorId === debate.challengerId)
      const opponentStatement = debate.opponentId ? currentRoundStatements.find(s => s.authorId === debate.opponentId) : null

      if (!challengerStatement && !debate.challenger.isAI) {
        console.log(`\n⏸️  Waiting for user (challenger) to submit statement for round ${updatedDebate.currentRound}`)
        break
      }

      if (!opponentStatement && debate.opponent?.isAI) {
        console.log(`\n⏳ Waiting for AI to respond...`)
        // Continue loop to trigger again
      } else if (!opponentStatement && !debate.opponent?.isAI) {
        console.log(`\n⏸️  Waiting for user (opponent) to submit statement for round ${updatedDebate.currentRound}`)
        break
      }
    }

    if (iteration >= maxIterations) {
      console.log(`\n⚠️  Reached maximum iterations (${maxIterations}). Stopping.`)
    }

    // Final status
    const finalDebate = await prisma.debate.findUnique({
      where: { id: debate.id },
      select: {
        status: true,
        currentRound: true,
        totalRounds: true,
        winnerId: true,
      },
    })

    console.log(`\n📊 Final Status:`)
    console.log(`   Status: ${finalDebate?.status}`)
    console.log(`   Round: ${finalDebate?.currentRound}/${finalDebate?.totalRounds}`)
    console.log(`   Winner: ${finalDebate?.winnerId || 'None'}`)

  } catch (error: any) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

completeDebateWithAI()
