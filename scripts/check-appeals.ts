import { prisma } from '@/lib/db/prisma'

async function checkAppeals() {
  try {
    console.log('\n=== Checking Appeal Status ===\n')

    const appeals = await prisma.debate.findMany({
      where: {
        appealStatus: {
          in: ['PENDING', 'PROCESSING'],
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

    console.log(`Found ${appeals.length} unprocessed appeal(s):\n`)

    appeals.forEach((appeal, index) => {
      console.log(`${index + 1}. Debate: ${appeal.topic}`)
      console.log(`   ID: ${appeal.id}`)
      console.log(`   Status: ${appeal.status}`)
      console.log(`   Appeal Status: ${appeal.appealStatus}`)
      console.log(`   Appealed At: ${appeal.appealedAt?.toLocaleString()}`)
      console.log(`   Appealed By: ${appeal.appealedBy}`)
      console.log(`   Challenger: ${appeal.challenger.username}`)
      console.log(`   Opponent: ${appeal.opponent?.username || 'N/A'}`)
      console.log(`   Appeal Reason: ${appeal.appealReason?.substring(0, 50)}...`)
      console.log('')
    })

    if (appeals.length > 0) {
      console.log('\nTo process these appeals, run:')
      console.log('npm run process-appeals\n')
    } else {
      console.log('No stuck appeals found!\n')
    }
  } catch (error) {
    console.error('Error checking appeals:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAppeals()

