import { prisma } from '@/lib/db/prisma'

/**
 * Script to add Firebase Server Key and VAPID Key to admin settings
 * 
 * Usage:
 *   npx tsx scripts/add-firebase-keys.ts <server-key> <vapid-key>
 * 
 * Or set them directly in the script below
 */

async function addFirebaseKeys() {
  // TODO: Replace these with your actual keys from Firebase Console
  const serverKey = process.argv[2] || '' // Get from Firebase Console → Cloud Messaging → Server key (after enabling Legacy API)
  const vapidKey = process.argv[3] || 'BN6Huso6iHfjB14YW42KyuNGlBPs18Kf9x_h2uzyiAxQVk2jwR1-oQaYKYU54aikqOtB4lKxi6-xLl0jjmTDx4g' // From Web Push certificates

  if (!serverKey) {
    console.error('❌ Server Key is required!')
    console.log('\n📝 To get Server Key:')
    console.log('   1. Go to Firebase Console → Project Settings → Cloud Messaging')
    console.log('   2. Enable "Cloud Messaging API (Legacy)"')
    console.log('   3. Copy the Server key (starts with AAAA...)')
    console.log('\n💡 Usage: npx tsx scripts/add-firebase-keys.ts <server-key> <vapid-key>')
    process.exit(1)
  }

  if (!vapidKey) {
    console.error('❌ VAPID Key is required!')
    process.exit(1)
  }

  console.log('🔥 Adding Firebase keys to admin settings...\n')

  try {
    // Add Server Key
    await prisma.adminSetting.upsert({
      where: { key: 'FIREBASE_SERVER_KEY' },
      update: { value: serverKey, encrypted: true },
      create: { key: 'FIREBASE_SERVER_KEY', value: serverKey, encrypted: true },
    })
    console.log(`✅ FIREBASE_SERVER_KEY: ${serverKey.substring(0, 20)}...`)

    // Add VAPID Key
    await prisma.adminSetting.upsert({
      where: { key: 'FIREBASE_VAPID_KEY' },
      update: { value: vapidKey, encrypted: false },
      create: { key: 'FIREBASE_VAPID_KEY', value: vapidKey, encrypted: false },
    })
    console.log(`✅ FIREBASE_VAPID_KEY: ${vapidKey.substring(0, 20)}...`)

    console.log('\n✅ Firebase keys added successfully!')
    console.log('\n📝 Next steps:')
    console.log('   1. Apply database migration: psql $DATABASE_URL -f prisma/migrations/20251210000000_add_fcm_tokens/migration.sql')
    console.log('   2. Test push notifications!')

  } catch (error: any) {
    console.error('❌ Error adding Firebase keys:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addFirebaseKeys()

