/**
 * Check tournament data including privacy settings
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkTournamentData() {
  try {
    const tournaments = await prisma.tournament.findMany({
      select: {
        id: true,
        name: true,
        isPrivate: true,
        invitedUserIds: true,
        creatorId: true,
        creator: {
          select: {
            username: true,
          },
        },
      },
    })

    console.log('Tournaments in database:')
    console.log(JSON.stringify(tournaments, null, 2))
  } catch (error: any) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkTournamentData()

export {}

