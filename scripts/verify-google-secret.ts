/**
 * Verify Google OAuth Client Secret in database
 * Run with: npx tsx scripts/verify-google-secret.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyGoogleSecret() {
  console.log('🔍 Verifying Google OAuth Client Secret in database...\n')

  try {
    const clientIdSetting = await prisma.adminSetting.findUnique({
      where: { key: 'GOOGLE_CLIENT_ID' },
    })

    const clientSecretSetting = await prisma.adminSetting.findUnique({
      where: { key: 'GOOGLE_CLIENT_SECRET' },
    })

    console.log('📋 Current Database Values:')
    console.log('─'.repeat(60))
    
    if (clientIdSetting) {
      console.log(`\n✅ GOOGLE_CLIENT_ID:`)
      console.log(`   Full value: ${clientIdSetting.value}`)
      console.log(`   Length: ${clientIdSetting.value.length} characters`)
      console.log(`   Expected: 563658606120-shf21b7km8jsfp5stgicg6q75hdvcr0p.apps.googleusercontent.com`)
      console.log(`   Match: ${clientIdSetting.value === '563658606120-shf21b7km8jsfp5stgicg6q75hdvcr0p.apps.googleusercontent.com' ? '✅ YES' : '❌ NO'}`)
    } else {
      console.log('\n❌ GOOGLE_CLIENT_ID: Not found in database')
    }

    if (clientSecretSetting) {
      console.log(`\n✅ GOOGLE_CLIENT_SECRET:`)
      console.log(`   Full value: ${clientSecretSetting.value}`)
      console.log(`   Length: ${clientSecretSetting.value.length} characters`)
      console.log(`   Expected: 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`)
      console.log(`   Match: ${clientSecretSetting.value === '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' ? '✅ YES' : '❌ NO'}`)
      console.log(`   Starts with GOCSPX: ${clientSecretSetting.value.startsWith('GOCSPX-') ? '✅ YES' : '❌ NO'}`)
      console.log(`   Has whitespace: ${/\s/.test(clientSecretSetting.value) ? '⚠️  YES (this is a problem!)' : '✅ NO'}`)
      console.log(`   Encrypted flag: ${clientSecretSetting.encrypted ? '✅ YES' : '❌ NO'}`)
    } else {
      console.log('\n❌ GOOGLE_CLIENT_SECRET: Not found in database')
    }

    console.log('\n' + '─'.repeat(60))
    console.log('\n💡 If the values don\'t match:')
    console.log('   1. Go to https://www.argufight.com/admin/settings')
    console.log('   2. Scroll to "Google OAuth" section')
    console.log('   3. Make sure Client Secret is: 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')
    console.log('   4. Make sure there are NO extra spaces before or after')
    console.log('   5. Click "Save Settings"')
    console.log('   6. Wait a few minutes for Vercel to redeploy')

  } catch (error: any) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

verifyGoogleSecret()

