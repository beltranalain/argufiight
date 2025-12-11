/**
 * Fix Google OAuth Client Secret in database
 * Run with: npx tsx scripts/fix-google-secret.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixGoogleSecret() {
  console.log('🔧 Fixing Google OAuth Client Secret in database...\n')

  const CORRECT_SECRET = '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'

  try {
    // Check current value
    const currentSetting = await prisma.adminSetting.findUnique({
      where: { key: 'GOOGLE_CLIENT_SECRET' },
    })

    if (!currentSetting) {
      console.log('❌ GOOGLE_CLIENT_SECRET not found in database')
      console.log('   Creating new setting...')
      
      await prisma.adminSetting.create({
        data: {
          key: 'GOOGLE_CLIENT_SECRET',
          value: CORRECT_SECRET,
          encrypted: true,
        },
      })
      console.log('✅ Created GOOGLE_CLIENT_SECRET with correct value')
    } else {
      console.log('📋 Current value:', currentSetting.value)
      console.log('📋 Expected value:', CORRECT_SECRET)
      
      if (currentSetting.value === CORRECT_SECRET) {
        console.log('✅ Client Secret is already correct!')
      } else {
        console.log('⚠️  Client Secret is incorrect. Updating...')
        
        await prisma.adminSetting.update({
          where: { key: 'GOOGLE_CLIENT_SECRET' },
          data: {
            value: CORRECT_SECRET,
            encrypted: true,
          },
        })
        
        console.log('✅ Updated GOOGLE_CLIENT_SECRET to correct value')
      }
    }

    // Verify
    const updatedSetting = await prisma.adminSetting.findUnique({
      where: { key: 'GOOGLE_CLIENT_SECRET' },
    })

    console.log('\n✅ Verification:')
    console.log(`   Value: ${updatedSetting?.value}`)
    console.log(`   Correct: ${updatedSetting?.value === CORRECT_SECRET ? '✅ YES' : '❌ NO'}`)
    console.log(`   Length: ${updatedSetting?.value?.length} characters`)

    console.log('\n🎉 Done! Google OAuth should work now.')
    console.log('   Note: If you\'re on Vercel, wait a few minutes for the change to propagate.')

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

fixGoogleSecret()

