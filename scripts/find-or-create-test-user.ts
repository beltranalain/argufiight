/**
 * Find or create a test user
 * Usage: npx tsx scripts/find-or-create-test-user.ts <email> <username> <password>
 */

import { prisma } from '../lib/db/prisma'
import { hashPassword } from '../lib/auth/password'

async function findOrCreateUser(email: string, username: string, password: string) {
  try {
    console.log(`\n=== Finding or creating test user ===\n`)

    // Try to find by email
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        username: true,
        passwordHash: true,
      },
    })

    // If not found, try by username
    if (!user) {
      user = await prisma.user.findFirst({
        where: { username },
        select: {
          id: true,
          email: true,
          username: true,
          passwordHash: true,
        },
      })
    }

    if (user) {
      console.log(`✅ User found:`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Username: ${user.username}`)
      console.log(`   Has Password: ${user.passwordHash ? 'Yes' : 'No'}`)
      
      // If password provided and user doesn't have one, or if user wants to reset
      if (password) {
        const passwordHash = await hashPassword(password)
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash },
        })
        console.log(`\n✅ Password has been set/reset!`)
        console.log(`\n📝 Login Credentials:`)
        console.log(`   Email: ${user.email}`)
        console.log(`   Username: ${user.username}`)
        console.log(`   Password: ${password}`)
      } else if (!user.passwordHash) {
        console.log(`\n⚠️  User has no password. Run with a password to set one.`)
      }
    } else {
      console.log(`❌ User not found.`)
      
      if (password) {
        console.log(`\n📝 Creating new user...`)
        const passwordHash = await hashPassword(password)
        
        const newUser = await prisma.user.create({
          data: {
            email: email.toLowerCase().trim(),
            username,
            passwordHash,
            eloRating: 1200,
          },
        })
        
        console.log(`✅ User created successfully!`)
        console.log(`\n📝 Login Credentials:`)
        console.log(`   Email: ${newUser.email}`)
        console.log(`   Username: ${newUser.username}`)
        console.log(`   Password: ${password}`)
      } else {
        console.log(`\n⚠️  To create the user, provide a password.`)
      }
    }
  } catch (error: any) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

const email = process.argv[2]
const username = process.argv[3]
const password = process.argv[4]

if (!email) {
  console.log('Usage: npx tsx scripts/find-or-create-test-user.ts <email> [username] [password]')
  console.log('\nExamples:')
  console.log('  npx tsx scripts/find-or-create-test-user.ts RiceSzn@RiceSzn.com RiceSzn')
  console.log('  npx tsx scripts/find-or-create-test-user.ts RiceSzn@RiceSzn.com RiceSzn testpassword123')
  process.exit(1)
}

findOrCreateUser(email, username || email.split('@')[0], password || '')
