import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyAllDebates() {
  try {
    console.log('🔍 Verifying all debates and user stats...\n')

    // Get all users with debates
    const users = await prisma.user.findMany({
      where: {
        totalDebates: { gt: 0 },
      },
      select: {
        id: true,
        username: true,
        debatesWon: true,
        debatesLost: true,
        debatesTied: true,
        totalDebates: true,
      },
    })

    for (const user of users) {
      console.log(`\n👤 ${user.username}:`)
      console.log(`   Stats: W:${user.debatesWon} L:${user.debatesLost} T:${user.debatesTied} Total:${user.totalDebates}`)
      
      // Check if stats add up
      const calculatedTotal = user.debatesWon + user.debatesLost + user.debatesTied
      if (calculatedTotal !== user.totalDebates) {
        console.log(`   ⚠️  MISMATCH: ${calculatedTotal} outcomes but ${user.totalDebates} total debates!`)
      }

      // Get all debates for this user
      const debates = await prisma.debate.findMany({
        where: {
          OR: [
            { challengerId: user.id },
            { opponentId: user.id },
          ],
          status: { in: ['COMPLETED', 'VERDICT_READY'] },
        },
        select: {
          id: true,
          topic: true,
          status: true,
          winnerId: true,
          challengerId: true,
          opponentId: true,
        },
      })

      console.log(`   Debates (${debates.length}):`)
      let wins = 0
      let losses = 0
      let ties = 0

      for (const debate of debates) {
        const isChallenger = debate.challengerId === user.id
        const isOpponent = debate.opponentId === user.id
        
        let result = '?'
        if (debate.winnerId === null) {
          result = 'TIE'
          ties++
        } else if (debate.winnerId === user.id) {
          result = 'WIN'
          wins++
        } else {
          result = 'LOSS'
          losses++
        }

        const opponent = isChallenger ? 'opponent' : 'challenger'
        console.log(`     - ${debate.topic.substring(0, 40)}... [${result}] (${opponent})`)
      }

      console.log(`   Calculated from debates: W:${wins} L:${losses} T:${ties} Total:${debates.length}`)
      
      if (wins !== user.debatesWon || losses !== user.debatesLost || ties !== user.debatesTied) {
        console.log(`   ⚠️  STATS DON'T MATCH! Need to fix:`)
        console.log(`      Should be: W:${wins} L:${losses} T:${ties}`)
        console.log(`      Currently: W:${user.debatesWon} L:${user.debatesLost} T:${user.debatesTied}`)
        
        // Fix it
        await prisma.user.update({
          where: { id: user.id },
          data: {
            debatesWon: wins,
            debatesLost: losses,
            debatesTied: ties,
            totalDebates: debates.length,
          },
        })
        console.log(`   ✅ Fixed!`)
      }
    }

    console.log(`\n✅ Verification complete!`)

  } catch (error: any) {
    console.error('❌ Error verifying debates:', error)
    console.error(error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

verifyAllDebates()

