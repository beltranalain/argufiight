/**
 * Fix existing tournaments: Add creator as participant if missing
 * Usage: npx tsx scripts/fix-tournament-creators.ts [tournament-id]
 * 
 * If tournament-id is provided, only fixes that tournament.
 * Otherwise, fixes all tournaments where creator is not a participant.
 */

import { prisma } from '../lib/db/prisma'

async function fixTournamentCreators() {
  const tournamentId = process.argv[2]

  try {
    if (tournamentId) {
      // Fix specific tournament
      const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: {
          participants: {
            select: {
              userId: true,
            },
          },
          creator: {
            select: {
              id: true,
              username: true,
              eloRating: true,
            },
          },
        },
      })

      if (!tournament) {
        console.error(`Tournament ${tournamentId} not found`)
        process.exit(1)
      }

      const creatorIsParticipant = tournament.participants.some(
        (p) => p.userId === tournament.creatorId
      )

      if (creatorIsParticipant) {
        console.log(`✅ Creator ${tournament.creator.username} is already a participant`)
        return
      }

      // Add creator as participant
      await prisma.tournamentParticipant.create({
        data: {
          tournamentId: tournament.id,
          userId: tournament.creatorId,
          seed: 1, // Creator is always seed 1
          eloAtStart: tournament.creator.eloRating,
          status: 'REGISTERED',
        },
      })

      console.log(`✅ Added creator ${tournament.creator.username} as participant (seed 1) to tournament "${tournament.name}"`)
    } else {
      // Fix all tournaments
      const tournaments = await prisma.tournament.findMany({
        include: {
          participants: {
            select: {
              userId: true,
            },
          },
          creator: {
            select: {
              id: true,
              username: true,
              eloRating: true,
            },
          },
        },
      })

      console.log(`Found ${tournaments.length} tournaments to check\n`)

      let fixed = 0
      let alreadyFixed = 0

      for (const tournament of tournaments) {
        const creatorIsParticipant = tournament.participants.some(
          (p) => p.userId === tournament.creatorId
        )

        if (creatorIsParticipant) {
          alreadyFixed++
          continue
        }

        // Add creator as participant
        await prisma.tournamentParticipant.create({
          data: {
            tournamentId: tournament.id,
            userId: tournament.creatorId,
            seed: 1, // Creator is always seed 1
            eloAtStart: tournament.creator.eloRating,
            status: 'REGISTERED',
          },
        })

        console.log(`✅ Fixed: Added creator ${tournament.creator.username} to tournament "${tournament.name}"`)
        fixed++
      }

      console.log(`\n📊 Summary:`)
      console.log(`   Fixed: ${fixed} tournaments`)
      console.log(`   Already correct: ${alreadyFixed} tournaments`)
      console.log(`   Total: ${tournaments.length} tournaments`)
    }
  } catch (error: any) {
    console.error('Error fixing tournaments:', error)
    process.exit(1)
  }
}

fixTournamentCreators()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

