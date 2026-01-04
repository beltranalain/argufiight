/**
 * Test the belt challenge API endpoint directly
 * This simulates what happens when a user clicks "Challenge"
 */

import { prisma } from '@/lib/db/prisma'
import { createBeltChallenge } from '@/lib/belts/core'
import { calculateChallengeEntryFee } from '@/lib/belts/coin-economics'

async function testChallengeAPI() {
  console.log('🧪 Testing Belt Challenge API Endpoint...\n')

  try {
    // Find a belt with a holder
    const belt = await prisma.belt.findFirst({
      where: {
        currentHolderId: { not: null },
        status: 'ACTIVE',
      },
      include: {
        currentHolder: {
          select: {
            id: true,
            username: true,
            eloRating: true,
            coins: true,
          },
        },
      },
    })

    if (!belt || !belt.currentHolder) {
      console.log('❌ No active belt with holder found')
      return
    }

    // Find a different user to be the challenger
    const challenger = await prisma.user.findFirst({
      where: {
        id: { not: belt.currentHolderId },
        isAdmin: false,
      },
      select: {
        id: true,
        username: true,
        coins: true,
        eloRating: true,
      },
    })

    if (!challenger) {
      console.log('❌ No challenger user found')
      return
    }

    console.log('✅ Test Setup:')
    console.log('   Belt:', belt.name, '(ID:', belt.id + ')')
    console.log('   Holder:', belt.currentHolder.username, '(ID:', belt.currentHolder.id + ')')
    console.log('   Challenger:', challenger.username, '(ID:', challenger.id + ')')
    console.log('   Challenger Coins:', challenger.coins)

    // Calculate entry fee
    const entryFee = await calculateChallengeEntryFee(belt.id)
    console.log('\n💰 Entry Fee:', entryFee, 'coins')

    // Check if challenger has enough coins (or free challenge)
    console.log('   Challenger has coins:', challenger.coins)
    console.log('   Entry fee required:', entryFee)

    // Test creating a challenge (with belt system enabled)
    const originalFlag = process.env.ENABLE_BELT_SYSTEM
    process.env.ENABLE_BELT_SYSTEM = 'true'

    try {
      console.log('\n📝 Creating test challenge...')
      const challenge = await createBeltChallenge(
        belt.id,
        challenger.id,
        entryFee,
        {
          topic: `Test Challenge for ${belt.name}`,
          description: 'This is a test challenge created by the test script',
          category: 'GENERAL',
          challengerPosition: 'FOR',
          totalRounds: 5,
          roundDuration: 86400000, // 24 hours
          speedMode: false,
          allowCopyPaste: true,
        }
      )

      console.log('✅ Challenge created successfully!')
      console.log('   Challenge ID:', challenge.id)
      console.log('   Status:', challenge.status)
      console.log('   Entry Fee:', challenge.entryFee)
      console.log('   Coin Reward:', challenge.coinReward)
      console.log('   Expires At:', challenge.expiresAt)

      // Clean up - delete the test challenge
      await prisma.beltChallenge.delete({
        where: { id: challenge.id },
      })
      console.log('\n🧹 Test challenge cleaned up')

      console.log('\n✅ API TEST PASSED - Challenge creation works!')
    } catch (error: any) {
      console.error('❌ Challenge creation failed:', error.message)
      console.error('   Error details:', error)
      throw error
    } finally {
      if (originalFlag !== 'true') {
        process.env.ENABLE_BELT_SYSTEM = originalFlag || ''
      }
    }

  } catch (error: any) {
    console.error('❌ Test failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testChallengeAPI()
