import { prisma } from '@/lib/db/prisma'

async function processAppeals() {
  try {
    console.log('\n=== Processing Stuck Appeals ===\n')

    const stuckAppeals = await prisma.debate.findMany({
      where: {
        appealStatus: {
          in: ['PENDING', 'PROCESSING'],
        },
        status: 'APPEALED',
      },
      include: {
        challenger: {
          select: {
            id: true,
            username: true,
            eloRating: true,
          },
        },
        opponent: {
          select: {
            id: true,
            username: true,
            eloRating: true,
          },
        },
        statements: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        verdicts: {
          include: {
            judge: {
              select: { id: true },
            },
          },
        },
      },
    })

    if (stuckAppeals.length === 0) {
      console.log('No stuck appeals to process.\n')
      return
    }

    console.log(`Found ${stuckAppeals.length} stuck appeal(s) to process.\n`)

    for (const debate of stuckAppeals) {
      console.log(`Processing appeal for: ${debate.topic}`)
      console.log(`Debate ID: ${debate.id}`)

      try {
        // Import the regenerate function logic
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        const response = await fetch(`${baseUrl}/api/verdicts/regenerate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ debateId: debate.id }),
        })

        if (response.ok) {
          console.log(`✅ Successfully processed appeal for debate ${debate.id}\n`)
        } else {
          const error = await response.json()
          console.error(`❌ Failed to process appeal: ${error.error}\n`)
        }
      } catch (error: any) {
        console.error(`❌ Error processing appeal: ${error.message}\n`)
      }
    }

    console.log('\n=== Processing Complete ===\n')
  } catch (error) {
    console.error('Error processing appeals:', error)
  } finally {
    await prisma.$disconnect()
  }
}

processAppeals()










