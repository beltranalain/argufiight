import { prisma } from '@/lib/db/prisma'

/**
 * Script to add Firebase VAPID Key to admin settings
 */

async function addVapidKey() {
  const vapidKey = 'BN6Huso6iHfjB14YW42KyuNGlBPs18Kf9x_h2uzyiAxQVk2jwR1-oQaYKYU54aikqOtB4lKxi6-xLl0jjmTDx4g'

  console.log('🔥 Adding Firebase VAPID Key to admin settings...\n')

  try {
    await prisma.adminSetting.upsert({
      where: { key: 'FIREBASE_VAPID_KEY' },
      update: { value: vapidKey, encrypted: false },
      create: { key: 'FIREBASE_VAPID_KEY', value: vapidKey, encrypted: false },
    })
    console.log(`✅ FIREBASE_VAPID_KEY: ${vapidKey.substring(0, 30)}...`)

    console.log('\n✅ VAPID Key added successfully!')
    console.log('\n⚠️  You still need to add the Server Key:')
    console.log('   1. Go to Firebase Console → Project Settings → Cloud Messaging')
    console.log('   2. Find "Cloud Messaging API (Legacy)" section')
    console.log('   3. Click the three dots (⋮) → Enable')
    console.log('   4. Copy the Server key (starts with AAAA...)')
    console.log('   5. Add it in Admin Dashboard → Settings → Firebase Push Notifications')
    console.log('\n   Or run: npx tsx scripts/add-firebase-keys.ts <server-key> <vapid-key>')

  } catch (error: any) {
    console.error('❌ Error adding VAPID key:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addVapidKey()

