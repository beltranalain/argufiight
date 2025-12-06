import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixTies() {
  try {
    console.log('🔍 Checking for debates with ties...\n')

    // Find all completed debates
    const completedDebates = await prisma.debate.findMany({
      where: {
        status: 'COMPLETED',
      },
      include: {
        verdicts: {
          select: {
            decision: true,
            winnerId: true,
          },
        },
        challenger: {
          select: {
            id: true,
            username: true,
            debatesWon: true,
            debatesLost: true,
            debatesTied: true,
          },
        },
        opponent: {
          select: {
            id: true,
            username: true,
            debatesWon: true,
            debatesLost: true,
            debatesTied: true,
          },
        },
      },
    })

    console.log(`Found ${completedDebates.length} completed debates\n`)

    let tiesFixed = 0
    let tiesFound = 0

    for (const debate of completedDebates) {
      // Determine if this is a tie based on verdicts
      const challengerWins = debate.verdicts.filter(v => v.winnerId === debate.challengerId).length
      const opponentWins = debate.verdicts.filter(v => v.winnerId === debate.opponentId).length
      const tieVotes = debate.verdicts.filter(v => v.decision === 'TIE' || v.winnerId === null).length

      const isTie = challengerWins === opponentWins && challengerWins === tieVotes || 
                   (challengerWins < opponentWins && opponentWins === tieVotes) ||
                   (opponentWins < challengerWins && challengerWins === tieVotes) ||
                   (challengerWins === 0 && opponentWins === 0 && tieVotes > 0)

      if (isTie) {
        tiesFound++
        console.log(`\n📊 Debate ${debate.id}: TIE detected`)
        console.log(`   Topic: ${debate.topic}`)
        console.log(`   Challenger: ${debate.challenger.username} (W:${debate.challenger.debatesWon} L:${debate.challenger.debatesLost} T:${debate.challenger.debatesTied})`)
        if (debate.opponent) {
          console.log(`   Opponent: ${debate.opponent.username} (W:${debate.opponent.debatesWon} L:${debate.opponent.debatesLost} T:${debate.opponent.debatesTied})`)
        }
        console.log(`   Verdicts: ${challengerWins} challenger wins, ${opponentWins} opponent wins, ${tieVotes} ties`)

        // Check if ties are already recorded
        const challengerShouldHaveTie = debate.challenger.debatesTied > 0
        const opponentShouldHaveTie = debate.opponent ? debate.opponent.debatesTied > 0 : true

        // Check if this debate was already counted as a tie
        // We need to check if the users' stats match what they should be
        // This is a simplified check - in reality, we'd need to track which debates contributed to which stats

        // For now, let's just ensure both users have at least 1 tie if this is a tie debate
        // and the debate doesn't have a clear winner
        if (!debate.winnerId) {
          // This is definitely a tie - ensure stats are correct
          console.log(`   ✅ Debate marked as tie (no winnerId)`)
          
          // Check if users need tie increments
          // Note: This is a simple check - we can't easily determine if this specific debate
          // was already counted without tracking debate-to-stats relationships
          // For now, we'll just log and let the user know they may need to manually verify
        }
      }
    }

    console.log(`\n\n📈 Summary:`)
    console.log(`   Total completed debates: ${completedDebates.length}`)
    console.log(`   Ties found: ${tiesFound}`)
    console.log(`   Ties fixed: ${tiesFixed}`)
    console.log(`\n💡 Note: If ties are not showing, the debate may need to be re-processed.`)
    console.log(`   Check if the debate has verdicts and if winnerId is null for tie debates.`)

  } catch (error: any) {
    console.error('❌ Error fixing ties:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixTies()

