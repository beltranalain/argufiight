import { prisma } from '../lib/db/prisma'

async function disable2FA(email: string) {
  try {
    console.log(`Disabling 2FA for: ${email}`)
    
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        username: true,
        totpEnabled: true,
      },
    })

    if (!user) {
      console.log('❌ User not found')
      return
    }

    if (!user.totpEnabled) {
      console.log('✅ 2FA is already disabled for this user')
      return
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: {
        totpEnabled: false,
        totpSecret: null,
        totpBackupCodes: null,
      },
    })

    console.log('✅ 2FA disabled successfully!')
    console.log(`   User: ${user.username} (${user.email})`)
    console.log(`\n📝 User can now log in without 2FA`)
  } catch (error: any) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

// Get email from command line
const email = process.argv[2]

if (!email) {
  console.log('Usage: npx tsx scripts/disable-2fa.ts <email>')
  console.log('Example: npx tsx scripts/disable-2fa.ts abc@abmo.com')
  process.exit(1)
}

disable2FA(email)

