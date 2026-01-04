/**
 * Grant 1,000,000 coins to belt_champion for testing
 */

import { prisma } from '../lib/db/prisma'
import { addCoins } from '../lib/belts/coin-economics'

async function grantCoinsToChampion() {
  try {
    console.log('\n💰 Granting 1,000,000 coins to belt_champion...\n')

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username: 'belt_champion' },
      select: { id: true, username: true, coins: true },
    })

    if (!user) {
      console.error('❌ User "belt_champion" not found')
      process.exit(1)
    }

    console.log(`✅ Found user: ${user.username} (ID: ${user.id})`)
    console.log(`   Current balance: ${user.coins.toLocaleString()} coins`)

    // Grant 1,000,000 coins
    const amount = 1_000_000
    const newBalance = await addCoins(user.id, amount, {
      type: 'ADMIN_GRANT',
      description: 'Test coins granted for belt system testing',
      metadata: {
        grantedBy: 'system',
        grantedByUsername: 'system',
        reason: 'Testing belt system and coin features',
      },
    })

    console.log(`\n✅ Successfully granted ${amount.toLocaleString()} coins`)
    console.log(`   New balance: ${newBalance.toLocaleString()} coins`)
    console.log(`   Total: $${(newBalance / 100).toLocaleString()} USD value\n`)

    process.exit(0)
  } catch (error: any) {
    console.error('\n❌ Error granting coins:', error.message)
    console.error(error)
    process.exit(1)
  }
}

grantCoinsToChampion()
