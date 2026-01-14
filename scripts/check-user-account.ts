import { prisma } from '../lib/db/prisma'

/**
 * Check user account details for debugging login issues
 * Usage: npx tsx scripts/check-user-account.ts <email>
 */

async function checkUserAccount(email: string) {
  try {
    const normalizedEmail = email.toLowerCase().trim()
    
    console.log(`\n=== Checking User Account ===`)
    console.log(`Email: ${normalizedEmail}`)
    console.log(`\n`)
    
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        username: true,
        passwordHash: true,
        googleAuthEnabled: true,
        isBanned: true,
        bannedUntil: true,
        isAdmin: true,
        totpEnabled: true,
        createdAt: true,
      },
    })
    
    if (!user) {
      console.log('❌ User not found in database')
      return
    }
    
    console.log('✅ User found!')
    console.log(`  ID: ${user.id}`)
    console.log(`  Username: ${user.username}`)
    console.log(`  Email: ${user.email}`)
    console.log(`  Created: ${user.createdAt}`)
    console.log(`  Is Admin: ${user.isAdmin}`)
    console.log(`  Is Banned: ${user.isBanned}`)
    console.log(`  Banned Until: ${user.bannedUntil || 'N/A'}`)
    console.log(`  Google Auth Enabled: ${user.googleAuthEnabled}`)
    console.log(`  TOTP Enabled: ${user.totpEnabled}`)
    console.log(`\n`)
    
    // Check password
    if (user.googleAuthEnabled && !user.passwordHash) {
      console.log('⚠️  WARNING: User has Google-only authentication')
      console.log('   This account cannot login with email/password')
      console.log('   User must login via Google OAuth')
    } else if (!user.passwordHash) {
      console.log('⚠️  WARNING: User has no password set')
      console.log('   Password needs to be set before login')
    } else {
      console.log('✅ User has password set')
      console.log(`   Password hash exists: ${user.passwordHash.substring(0, 20)}...`)
    }
    
    // Check if user can login
    if (user.isBanned) {
      console.log('\n❌ User is banned - cannot login')
    } else if (user.googleAuthEnabled && !user.passwordHash) {
      console.log('\n❌ User can only login via Google OAuth')
    } else if (!user.passwordHash) {
      console.log('\n❌ User has no password - cannot login')
    } else {
      console.log('\n✅ User should be able to login')
      console.log('   If login fails, password may be incorrect')
    }
    
  } catch (error: any) {
    console.error('Error checking user:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

const email = process.argv[2]

if (!email) {
  console.log('Usage: npx tsx scripts/check-user-account.ts <email>')
  console.log('Example: npx tsx scripts/check-user-account.ts beltranalain@yahoo.com')
  process.exit(1)
}

checkUserAccount(email)
