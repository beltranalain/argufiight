import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixAllUserStats() {
  try {
    console.log('🔍 Fixing all user stats to be consistent...\n')

    // Find the tie debate
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
        statements: {
          include: {
            author: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    })

    if (!debate) {
      console.log('❌ Debate not found')
      return
    }

    console.log(`📊 Fixing stats for debate: ${debate.topic.substring(0, 50)}...`)
    console.log(`   WinnerId: ${debate.winnerId || 'NULL (TIE)'}\n`)

    // Since winnerId is null, this is a tie
    // If kubancane has 1 win and 1 tie, but total is 1, that means:
    // - The debate was counted as a win (wrong)
    // - We need to convert it from a win to a tie

    console.log(`   Challenger (kubancane) BEFORE:`)
    console.log(`     W:${debate.challenger.debatesWon} L:${debate.challenger.debatesLost} T:${debate.challenger.debatesTied} Total:${debate.challenger.totalDebates}`)
    
    if (debate.opponent) {
      console.log(`   Opponent (kamioi) BEFORE:`)
      console.log(`     W:${debate.opponent.debatesWon} L:${debate.opponent.debatesLost} T:${debate.opponent.debatesTied} Total:${debate.opponent.totalDebates}`)
    }

    // Fix challenger: if they have 1 win and 1 tie but total is 1, remove the win
    if (debate.challenger.debatesWon > 0 && debate.challenger.debatesTied > 0 && 
        debate.challenger.totalDebates === 1) {
      console.log(`\n   🔧 Fixing challenger: Converting win to tie`)
      await prisma.user.update({
        where: { id: debate.challengerId },
        data: {
          debatesWon: { decrement: 1 },
          debatesTied: { set: 1 }, // Ensure it's 1, not increment
        },
      })
    }

    // Fix opponent: if they have losses but should have a tie
    if (debate.opponentId && debate.opponent) {
      // Check if opponent has this debate counted as a loss
      // If they have 2 total but 0 ties and this is a tie, we need to check
      // Actually, let's just ensure they have 1 tie if this debate is a tie
      if (debate.opponent.debatesTied === 0 || debate.opponent.debatesTied < 1) {
        console.log(`\n   🔧 Fixing opponent: Ensuring tie is recorded`)
        // We need to be careful - if they have 2 losses and 2 total, one might be this debate
        // Let's check: if total is 2 and losses is 2, and this is a tie, we need to convert one loss to tie
        if (debate.opponent.totalDebates === debate.opponent.debatesLost && 
            debate.opponent.debatesLost > 0) {
          // One of the losses should be a tie
          await prisma.user.update({
            where: { id: debate.opponentId },
            data: {
              debatesLost: { decrement: 1 },
              debatesTied: { set: 1 },
            },
          })
        } else {
          // Just ensure tie is set
          await prisma.user.update({
            where: { id: debate.opponentId },
            data: {
              debatesTied: { set: 1 },
            },
          })
        }
      }
    }

    // Now recalculate Performance Analytics from actual debate data
    console.log(`\n   📊 Recalculating Performance Analytics...`)
    
    // Get all completed debates for challenger
    const challengerDebates = await prisma.debate.findMany({
      where: {
        OR: [
          { challengerId: debate.challengerId, status: { in: ['COMPLETED', 'VERDICT_READY'] } },
          { opponentId: debate.challengerId, status: { in: ['COMPLETED', 'VERDICT_READY'] } },
        ],
      },
      include: {
        statements: {
          where: {
            authorId: debate.challengerId,
          },
        },
      },
    })

    // Calculate stats for challenger
    let totalWords = 0
    let totalStatements = 0
    let totalRounds = 0

    for (const d of challengerDebates) {
      for (const statement of d.statements) {
        const wordCount = statement.content.split(/\s+/).filter(w => w.length > 0).length
        totalWords += wordCount
        totalStatements += 1
      }
      totalRounds += d.currentRound || d.totalRounds || 0
    }

    const avgWordsPerStatement = totalStatements > 0 ? totalWords / totalStatements : 0
    const avgRoundsPerDebate = challengerDebates.length > 0 ? totalRounds / challengerDebates.length : 0

    await prisma.user.update({
      where: { id: debate.challengerId },
      data: {
        totalWordCount: totalWords,
        totalStatements: totalStatements,
        averageWordCount: avgWordsPerStatement,
        averageRounds: avgRoundsPerDebate,
      },
    })

    console.log(`     kubancane: ${totalWords} words, ${totalStatements} statements, ${avgWordsPerStatement.toFixed(1)} avg words, ${avgRoundsPerDebate.toFixed(1)} avg rounds`)

    // Do the same for opponent
    if (debate.opponentId) {
      const opponentDebates = await prisma.debate.findMany({
        where: {
          OR: [
            { challengerId: debate.opponentId, status: { in: ['COMPLETED', 'VERDICT_READY'] } },
            { opponentId: debate.opponentId, status: { in: ['COMPLETED', 'VERDICT_READY'] } },
          ],
        },
        include: {
          statements: {
            where: {
              authorId: debate.opponentId,
            },
          },
        },
      })

      let oppTotalWords = 0
      let oppTotalStatements = 0
      let oppTotalRounds = 0

      for (const d of opponentDebates) {
        for (const statement of d.statements) {
          const wordCount = statement.content.split(/\s+/).filter(w => w.length > 0).length
          oppTotalWords += wordCount
          oppTotalStatements += 1
        }
        oppTotalRounds += d.currentRound || d.totalRounds || 0
      }

      const oppAvgWordsPerStatement = oppTotalStatements > 0 ? oppTotalWords / oppTotalStatements : 0
      const oppAvgRoundsPerDebate = opponentDebates.length > 0 ? oppTotalRounds / opponentDebates.length : 0

      await prisma.user.update({
        where: { id: debate.opponentId },
        data: {
          totalWordCount: oppTotalWords,
          totalStatements: oppTotalStatements,
          averageWordCount: oppAvgWordsPerStatement,
          averageRounds: oppAvgRoundsPerDebate,
        },
      })

      console.log(`     kamioi: ${oppTotalWords} words, ${oppTotalStatements} statements, ${oppAvgWordsPerStatement.toFixed(1)} avg words, ${oppAvgRoundsPerDebate.toFixed(1)} avg rounds`)
    }

    // Fetch and display final stats
    const finalChallenger = await prisma.user.findUnique({
      where: { id: debate.challengerId },
      select: {
        username: true,
        debatesWon: true,
        debatesLost: true,
        debatesTied: true,
        totalDebates: true,
        totalWordCount: true,
        totalStatements: true,
        averageWordCount: true,
        averageRounds: true,
      },
    })

    console.log(`\n   ✅ Challenger (kubancane) AFTER:`)
    console.log(`     W:${finalChallenger?.debatesWon} L:${finalChallenger?.debatesLost} T:${finalChallenger?.debatesTied} Total:${finalChallenger?.totalDebates}`)
    console.log(`     Words: ${finalChallenger?.totalWordCount}, Statements: ${finalChallenger?.totalStatements}`)
    console.log(`     Avg Words/Statement: ${finalChallenger?.averageWordCount?.toFixed(1)}, Avg Rounds: ${finalChallenger?.averageRounds?.toFixed(1)}`)

    if (debate.opponentId) {
      const finalOpponent = await prisma.user.findUnique({
        where: { id: debate.opponentId },
        select: {
          username: true,
          debatesWon: true,
          debatesLost: true,
          debatesTied: true,
          totalDebates: true,
          totalWordCount: true,
          totalStatements: true,
          averageWordCount: true,
          averageRounds: true,
        },
      })

      console.log(`\n   ✅ Opponent (kamioi) AFTER:`)
      console.log(`     W:${finalOpponent?.debatesWon} L:${finalOpponent?.debatesLost} T:${finalOpponent?.debatesTied} Total:${finalOpponent?.totalDebates}`)
      console.log(`     Words: ${finalOpponent?.totalWordCount}, Statements: ${finalOpponent?.totalStatements}`)
      console.log(`     Avg Words/Statement: ${finalOpponent?.averageWordCount?.toFixed(1)}, Avg Rounds: ${finalOpponent?.averageRounds?.toFixed(1)}`)
    }

    console.log(`\n✅ All stats have been fixed!`)

  } catch (error: any) {
    console.error('❌ Error fixing stats:', error)
    console.error(error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

fixAllUserStats()

