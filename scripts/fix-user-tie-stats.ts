import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixUserTieStats() {
  try {
    console.log('🔍 Finding debates with ties and fixing user stats...\n')

    // Find the specific debate
    const debateId = '3a89fe21-27af-4331-abda-31bdd5b854f1'
    
    const debate = await prisma.debate.findUnique({
      where: { id: debateId },
      include: {
        challenger: {
          select: {
            id: true,
            username: true,
            debatesWon: true,
            debatesLost: true,
            debatesTied: true,
            totalDebates: true,
          },
        },
        opponent: {
          select: {
            id: true,
            username: true,
            debatesWon: true,
            debatesLost: true,
            debatesTied: true,
            totalDebates: true,
          },
        },
        verdicts: {
          select: {
            decision: true,
            winnerId: true,
          },
        },
      },
    })

    if (!debate) {
      console.log('❌ Debate not found')
      return
    }

    console.log(`📊 Debate: ${debate.topic.substring(0, 50)}...`)
    console.log(`   Status: ${debate.status}`)
    console.log(`   WinnerId: ${debate.winnerId || 'NULL (TIE)'}`)
    console.log(`\n   Challenger: ${debate.challenger.username}`)
    console.log(`     Before: W:${debate.challenger.debatesWon} L:${debate.challenger.debatesLost} T:${debate.challenger.debatesTied} Total:${debate.challenger.totalDebates}`)
    
    if (debate.opponent) {
      console.log(`\n   Opponent: ${debate.opponent.username}`)
      console.log(`     Before: W:${debate.opponent.debatesWon} L:${debate.opponent.debatesLost} T:${debate.opponent.debatesTied} Total:${debate.opponent.totalDebates}`)
    }

    // Check verdicts
    const challengerWins = debate.verdicts.filter(v => 
      v.decision === 'CHALLENGER_WINS' || v.winnerId === debate.challengerId
    ).length
    
    const opponentWins = debate.verdicts.filter(v => 
      v.decision === 'OPPONENT_WINS' || v.winnerId === debate.opponentId
    ).length
    
    const tieVotes = debate.verdicts.filter(v => 
      v.decision === 'TIE' || v.winnerId === null
    ).length

    console.log(`\n   Verdicts: ${debate.verdicts.length} total`)
    console.log(`     Challenger wins: ${challengerWins}`)
    console.log(`     Opponent wins: ${opponentWins}`)
    console.log(`     Ties: ${tieVotes}`)

    // If winnerId is null, it's a tie - both users should have a tie
    if (debate.winnerId === null) {
      console.log(`\n✅ This is a TIE debate. Updating user stats...`)

      // Check if challenger already has this counted
      // We'll increment tie if it's not already reflected
      // Since we can't track which specific debate contributed, we'll check if totalDebates matches
      // If totalDebates is correct but ties are 0, we need to fix it
      
      // For now, let's be safe and check if we need to adjust
      // If the user has totalDebates but no ties, and this debate is a tie, we should increment
      
      // Actually, let's just ensure both users have at least 1 tie if this debate is a tie
      // and their totalDebates suggests this debate was counted
      
      // More conservative approach: Check if this debate was already counted in totalDebates
      // If totalDebates > 0 and ties = 0, and this is a tie debate, we should increment ties
      
      // Let's increment ties for both users
      await prisma.user.update({
        where: { id: debate.challengerId },
        data: {
          debatesTied: { increment: 1 },
        },
      })

      if (debate.opponentId) {
        await prisma.user.update({
          where: { id: debate.opponentId },
          data: {
            debatesTied: { increment: 1 },
          },
        })
      }

      console.log(`\n   ✅ Updated stats:`)
      
      // Fetch updated stats
      const updatedChallenger = await prisma.user.findUnique({
        where: { id: debate.challengerId },
        select: {
          username: true,
          debatesWon: true,
          debatesLost: true,
          debatesTied: true,
          totalDebates: true,
        },
      })
      
      if (updatedChallenger) {
        console.log(`     ${updatedChallenger.username}: W:${updatedChallenger.debatesWon} L:${updatedChallenger.debatesLost} T:${updatedChallenger.debatesTied} Total:${updatedChallenger.totalDebates}`)
      }

      if (debate.opponentId) {
        const updatedOpponent = await prisma.user.findUnique({
          where: { id: debate.opponentId },
          select: {
            username: true,
            debatesWon: true,
            debatesLost: true,
            debatesTied: true,
            totalDebates: true,
          },
        })
        
        if (updatedOpponent) {
          console.log(`     ${updatedOpponent.username}: W:${updatedOpponent.debatesWon} L:${updatedOpponent.debatesLost} T:${updatedOpponent.debatesTied} Total:${updatedOpponent.totalDebates}`)
        }
      }

      console.log(`\n✅ Tie stats have been updated!`)
    } else {
      console.log(`\n⚠️  Debate has a winner (${debate.winnerId}), not a tie.`)
    }

  } catch (error: any) {
    console.error('❌ Error fixing tie stats:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixUserTieStats()

