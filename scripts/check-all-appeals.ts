import { prisma } from '@/lib/db/prisma'

async function checkAllAppeals() {
  try {
    console.log('\n=== All Appeals Status ===\n')

    const allAppeals = await prisma.debate.findMany({
      where: {
        appealCount: {
          gt: 0,
        },
      },
      include: {
        challenger: {
          select: {
            id: true,
            username: true,
          },
        },
        opponent: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: {
        appealedAt: 'desc',
      },
    })

    console.log(`Total appeals found: ${allAppeals.length}\n`)

    allAppeals.forEach((appeal, index) => {
      console.log(`${index + 1}. Debate: ${appeal.topic}`)
      console.log(`   ID: ${appeal.id}`)
      console.log(`   Status: ${appeal.status}`)
      console.log(`   Appeal Status: ${appeal.appealStatus || 'NULL'}`)
      console.log(`   Appeal Count: ${appeal.appealCount}`)
      console.log(`   Appealed At: ${appeal.appealedAt?.toLocaleString() || 'NULL'}`)
      console.log(`   Original Winner: ${appeal.originalWinnerId || 'NULL'}`)
      console.log(`   Current Winner: ${appeal.winnerId || 'NULL'}`)
      console.log(`   Verdict Flipped: ${appeal.originalWinnerId && appeal.winnerId && appeal.originalWinnerId !== appeal.winnerId ? 'YES' : 'NO'}`)
      console.log(`   Challenger: ${appeal.challenger.username}`)
      console.log(`   Opponent: ${appeal.opponent?.username || 'N/A'}`)
      console.log('')
    })

    // Summary
    const byStatus = {
      PENDING: allAppeals.filter(a => a.appealStatus === 'PENDING').length,
      PROCESSING: allAppeals.filter(a => a.appealStatus === 'PROCESSING').length,
      RESOLVED: allAppeals.filter(a => a.appealStatus === 'RESOLVED').length,
      DENIED: allAppeals.filter(a => a.appealStatus === 'DENIED').length,
      NULL: allAppeals.filter(a => !a.appealStatus).length,
    }

    console.log('\n=== Summary by Status ===')
    console.log(`PENDING: ${byStatus.PENDING}`)
    console.log(`PROCESSING: ${byStatus.PROCESSING}`)
    console.log(`RESOLVED: ${byStatus.RESOLVED}`)
    console.log(`DENIED: ${byStatus.DENIED}`)
    console.log(`NULL: ${byStatus.NULL}`)

    const resolved = allAppeals.filter(a => a.appealStatus === 'RESOLVED')
    const successful = resolved.filter(a => {
      if (!a.originalWinnerId || !a.winnerId) return false
      return a.originalWinnerId !== a.winnerId
    })
    const failedCount = resolved.length - successful.length

    console.log('\n=== Resolution Summary ===')
    console.log(`Resolved: ${resolved.length}`)
    console.log(`Successful (flipped): ${successful.length}`)
    console.log(`Failed (same winner): ${failedCount}`)
    console.log('')
  } catch (error) {
    console.error('Error checking appeals:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAllAppeals()

