/**
 * Diagnostic script to check why a tournament might not be displaying
 * Usage: npx tsx scripts/check-tournament-display.ts [tournament-id]
 */

import { prisma } from '../lib/db/prisma'

async function checkTournamentDisplay() {
  const tournamentId = process.argv[2]

  if (!tournamentId) {
    console.log('Usage: npx tsx scripts/check-tournament-display.ts [tournament-id]')
    console.log('\nOr checking all tournaments...\n')
    
    // Check all tournaments
    const allTournaments = await prisma.tournament.findMany({
      include: {
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
        _count: {
          select: {
            participants: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    })

    console.log(`Found ${allTournaments.length} tournaments:\n`)
    
    for (const tournament of allTournaments) {
      console.log(`Tournament: ${tournament.name}`)
      console.log(`  ID: ${tournament.id}`)
      console.log(`  Status: ${tournament.status}`)
      console.log(`  Is Private: ${tournament.isPrivate}`)
      console.log(`  Creator: ${tournament.creator.username} (${tournament.creatorId})`)
      console.log(`  Participants: ${tournament._count.participants}`)
      if (tournament.invitedUserIds) {
        try {
          const invitedIds = JSON.parse(tournament.invitedUserIds) as string[]
          console.log(`  Invited Users: ${invitedIds.join(', ')}`)
        } catch (e) {
          console.log(`  Invited Users: (parse error) ${tournament.invitedUserIds}`)
        }
      }
      console.log(`  Created: ${tournament.createdAt}`)
      console.log('')
    }
    
    return
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      creator: {
        select: {
          id: true,
          username: true,
        },
      },
      participants: {
        select: {
          userId: true,
        },
      },
      _count: {
        select: {
          participants: true,
        },
      },
    },
  })

  if (!tournament) {
    console.error(`Tournament ${tournamentId} not found`)
    return
  }

  console.log('Tournament Details:')
  console.log(`  Name: ${tournament.name}`)
  console.log(`  ID: ${tournament.id}`)
  console.log(`  Status: ${tournament.status}`)
  console.log(`  Is Private: ${tournament.isPrivate}`)
  console.log(`  Creator: ${tournament.creator.username} (${tournament.creatorId})`)
  console.log(`  Participants: ${tournament._count.participants}`)
  console.log(`  Created: ${tournament.createdAt}`)
  
  if (tournament.isPrivate) {
    console.log('\n⚠️  This is a PRIVATE tournament')
    if (tournament.invitedUserIds) {
      try {
        const invitedIds = JSON.parse(tournament.invitedUserIds) as string[]
        console.log(`  Invited Users: ${invitedIds.join(', ')}`)
        console.log(`  Only these users (and the creator) can see it`)
      } catch (e) {
        console.log(`  Invited Users: (parse error) ${tournament.invitedUserIds}`)
      }
    } else {
      console.log(`  ⚠️  No invited users specified - this is invalid for a private tournament`)
    }
  } else {
    console.log('\n✅ This is a PUBLIC tournament - should be visible to everyone')
  }

  console.log(`\nStatus Check:`)
  const validStatuses = ['UPCOMING', 'REGISTRATION_OPEN', 'IN_PROGRESS']
  if (validStatuses.includes(tournament.status)) {
    console.log(`  ✅ Status "${tournament.status}" is valid for display`)
  } else {
    console.log(`  ⚠️  Status "${tournament.status}" is NOT in the filter list`)
    console.log(`  Valid statuses: ${validStatuses.join(', ')}`)
  }
}

checkTournamentDisplay()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

