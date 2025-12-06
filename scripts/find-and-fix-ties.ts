import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function findAndFixTies() {
  try {
    console.log('🔍 Searching for debates with ties...\n')

    // Find all debates with verdicts (including VERDICT_READY status)
    const debates = await prisma.debate.findMany({
      where: {
        OR: [
          { status: 'COMPLETED' },
          { status: 'VERDICT_READY' },
          { winnerId: null },
        ],
      },
      include: {
        verdicts: {
          select: {
            decision: true,
            winnerId: true,
            challengerScore: true,
            opponentScore: true,
          },
        },
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
      },
      orderBy: {
        endedAt: 'desc',
      },
      take: 50, // Check last 50 debates
    })

    console.log(`Found ${debates.length} debates to check\n`)

    let tiesFound = 0
    let tiesFixed = 0

    for (const debate of debates) {
      if (debate.verdicts.length === 0) {
        continue // Skip debates without verdicts
      }

      // Determine if this is a tie based on verdicts
      const challengerWins = debate.verdicts.filter(v => 
        v.decision === 'CHALLENGER_WINS' || v.winnerId === debate.challengerId
      ).length
      
      const opponentWins = debate.verdicts.filter(v => 
        v.decision === 'OPPONENT_WINS' || v.winnerId === debate.opponentId
      ).length
      
      const tieVotes = debate.verdicts.filter(v => 
        v.decision === 'TIE' || v.winnerId === null
      ).length

      // Determine if it's a tie
      const isTie = debate.winnerId === null || 
                   (challengerWins === opponentWins && challengerWins <= tieVotes) ||
                   (challengerWins < opponentWins && opponentWins === tieVotes) ||
                   (opponentWins < challengerWins && challengerWins === tieVotes) ||
                   (challengerWins === 0 && opponentWins === 0 && tieVotes > 0)

      if (isTie || debate.winnerId === null) {
        tiesFound++
        console.log(`\n📊 Debate ${debate.id}: ${isTie ? 'TIE' : 'POTENTIAL TIE'}`)
        console.log(`   Topic: ${debate.topic.substring(0, 50)}...`)
        console.log(`   Status: ${debate.status}`)
        console.log(`   WinnerId: ${debate.winnerId || 'NULL (TIE)'}`)
        console.log(`   Challenger: ${debate.challenger.username}`)
        console.log(`     Current stats: W:${debate.challenger.debatesWon} L:${debate.challenger.debatesLost} T:${debate.challenger.debatesTied} Total:${debate.challenger.totalDebates}`)
        
        if (debate.opponent) {
          console.log(`   Opponent: ${debate.opponent.username}`)
          console.log(`     Current stats: W:${debate.opponent.debatesWon} L:${debate.opponent.debatesLost} T:${debate.opponent.debatesTied} Total:${debate.opponent.totalDebates}`)
        }
        
        console.log(`   Verdicts: ${debate.verdicts.length} total`)
        console.log(`     Challenger wins: ${challengerWins}`)
        console.log(`     Opponent wins: ${opponentWins}`)
        console.log(`     Ties: ${tieVotes}`)

        // Check if this debate was properly counted
        // If winnerId is null, both users should have a tie for this debate
        if (debate.winnerId === null && debate.status === 'VERDICT_READY') {
          console.log(`   ⚠️  Debate has null winnerId but may not be counted in user stats`)
          
          // Check if we need to increment ties
          // We can't easily determine if this specific debate was already counted
          // But we can check if the total debates match what they should be
          
          // For now, let's just ensure the debate is marked correctly
          // and suggest manual verification
        }

        // If the debate is definitely a tie and winnerId is not null, fix it
        if (isTie && debate.winnerId !== null) {
          console.log(`   🔧 Fixing: Setting winnerId to null`)
          await prisma.debate.update({
            where: { id: debate.id },
            data: {
              winnerId: null,
            },
          })
          tiesFixed++
        }
      }
    }

    console.log(`\n\n📈 Summary:`)
    console.log(`   Debates checked: ${debates.length}`)
    console.log(`   Ties found: ${tiesFound}`)
    console.log(`   Ties fixed: ${tiesFixed}`)
    
    if (tiesFound > 0) {
      console.log(`\n💡 Next steps:`)
      console.log(`   1. Check the debates listed above`)
      console.log(`   2. If user stats don't show ties, you may need to:`)
      console.log(`      - Regenerate verdicts for those debates`)
      console.log(`      - Or manually update user stats`)
      console.log(`   3. Run this script again to verify fixes`)
    }

  } catch (error: any) {
    console.error('❌ Error finding/fixing ties:', error)
  } finally {
    await prisma.$disconnect()
  }
}

findAndFixTies()

