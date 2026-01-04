/**
 * Reset TECH Championship Belt
 * Unstakes the belt and sets it to ACTIVE status
 */

import { prisma } from '../lib/db/prisma'

async function resetTechBelt() {
  try {
    console.log('🔍 Finding TECH Championship Belt...')
    
    // Find the TECH belt
    const techBelt = await prisma.belt.findFirst({
      where: {
        OR: [
          { name: { contains: 'TECH', mode: 'insensitive' } },
          { category: 'TECH' },
        ],
      },
      include: {
        currentHolder: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    })

    if (!techBelt) {
      console.log('❌ TECH Championship Belt not found')
      return
    }

    console.log(`✅ Found belt: ${techBelt.name} (ID: ${techBelt.id})`)
    console.log(`   Current holder: ${techBelt.currentHolder?.username || 'None'}`)
    console.log(`   Status: ${techBelt.status}`)
    console.log(`   Is Staked: ${techBelt.isStaked}`)
    console.log(`   Staked in Debate: ${techBelt.stakedInDebateId || 'None'}`)
    console.log(`   Staked in Tournament: ${techBelt.stakedInTournamentId || 'None'}`)
    console.log('')

    // Check for pending challenges
    const pendingChallenges = await prisma.beltChallenge.findMany({
      where: {
        beltId: techBelt.id,
        status: 'PENDING',
      },
    })

    if (pendingChallenges.length > 0) {
      console.log(`⚠️  Found ${pendingChallenges.length} pending challenge(s). Deleting them...`)
      await prisma.beltChallenge.deleteMany({
        where: {
          beltId: techBelt.id,
          status: 'PENDING',
        },
      })
      console.log('✅ Deleted pending challenges')
    }

    // Reset the belt
    const updated = await prisma.belt.update({
      where: { id: techBelt.id },
      data: {
        isStaked: false,
        stakedInDebateId: null,
        stakedInTournamentId: null,
        status: 'ACTIVE',
      },
    })

    console.log('✅ Belt reset successfully!')
    console.log(`   New status: ${updated.status}`)
    console.log(`   Is Staked: ${updated.isStaked}`)
    console.log('')
    console.log('🎉 TECH Championship Belt is now challengeable!')
  } catch (error: any) {
    console.error('❌ Error resetting belt:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

resetTechBelt()
