/**
 * Set passwords for belt test users
 * Run: npx tsx scripts/set-belt-test-passwords.ts
 */

import { PrismaClient } from '@prisma/client'
import { hashPassword } from '@/lib/auth/password'

const prisma = new PrismaClient()

// Test users and their passwords
const TEST_USERS = [
  { email: 'champion@test.com', password: 'champion123' },
  { email: 'contender@test.com', password: 'contender123' },
  { email: 'challenger@test.com', password: 'challenger123' },
  { email: 'rookie@test.com', password: 'rookie123' },
  { email: 'veteran@test.com', password: 'veteran123' },
]

async function main() {
  console.log('\n🔐 Setting passwords for belt test users...\n')

  for (const userData of TEST_USERS) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      })

      if (!user) {
        console.log(`❌ User not found: ${userData.email}`)
        continue
      }

      const passwordHash = await hashPassword(userData.password)
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      })

      console.log(`✅ Password set for ${user.username} (${user.email})`)
      console.log(`   Password: ${userData.password}\n`)
    } catch (error: any) {
      console.error(`❌ Failed to set password for ${userData.email}:`, error.message)
    }
  }

  console.log('\n📝 Login Credentials:\n')
  console.log('='.repeat(50))
  for (const userData of TEST_USERS) {
    const user = await prisma.user.findUnique({
      where: { email: userData.email },
      select: { username: true },
    })
    if (user) {
      console.log(`Username: ${user.username}`)
      console.log(`Email: ${userData.email}`)
      console.log(`Password: ${userData.password}`)
      console.log('-'.repeat(50))
    }
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
