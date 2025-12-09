/**
 * Check if Google OAuth credentials are configured
 * Run with: npx tsx scripts/check-google-oauth-config.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkGoogleOAuthConfig() {
  console.log('🔍 Checking Google OAuth configuration...\n')

  try {
    // Check admin settings
    const clientIdSetting = await prisma.adminSetting.findUnique({
      where: { key: 'GOOGLE_CLIENT_ID' },
    })

    const clientSecretSetting = await prisma.adminSetting.findUnique({
      where: { key: 'GOOGLE_CLIENT_SECRET' },
    })

    console.log('📋 Admin Settings:')
    if (clientIdSetting) {
      console.log(`  ✅ GOOGLE_CLIENT_ID: ${clientIdSetting.value.substring(0, 30)}...`)
    } else {
      console.log('  ❌ GOOGLE_CLIENT_ID: Not found in admin settings')
    }

    if (clientSecretSetting) {
      console.log(`  ✅ GOOGLE_CLIENT_SECRET: ${clientSecretSetting.value.substring(0, 15)}...`)
    } else {
      console.log('  ❌ GOOGLE_CLIENT_SECRET: Not found in admin settings')
    }

    // Check environment variables
    console.log('\n🌍 Environment Variables:')
    const envClientId = process.env.GOOGLE_CLIENT_ID
    const envClientSecret = process.env.GOOGLE_CLIENT_SECRET

    if (envClientId) {
      console.log(`  ✅ GOOGLE_CLIENT_ID: ${envClientId.substring(0, 30)}...`)
    } else {
      console.log('  ❌ GOOGLE_CLIENT_ID: Not set in environment variables')
    }

    if (envClientSecret) {
      console.log(`  ✅ GOOGLE_CLIENT_SECRET: ${envClientSecret.substring(0, 15)}...`)
    } else {
      console.log('  ❌ GOOGLE_CLIENT_SECRET: Not set in environment variables')
    }

    // Final status
    console.log('\n📊 Status:')
    const hasClientId = clientIdSetting?.value || envClientId
    const hasClientSecret = clientSecretSetting?.value || envClientSecret

    if (hasClientId && hasClientSecret) {
      console.log('  ✅ Google OAuth is configured!')
      console.log('  💡 If you\'re still getting errors, try:')
      console.log('     1. Clear your browser cache')
      console.log('     2. Wait a few minutes for changes to propagate')
      console.log('     3. Check Vercel deployment logs')
    } else {
      console.log('  ❌ Google OAuth is NOT configured')
      console.log('\n  📝 To fix this:')
      console.log('     1. Go to https://www.argufight.com/admin/settings')
      console.log('     2. Scroll to "Google OAuth" section')
      console.log('     3. Enter your Client ID and Client Secret')
      console.log('     4. Click "Save Settings"')
    }
  } catch (error: any) {
    console.error('❌ Error checking configuration:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkGoogleOAuthConfig()

