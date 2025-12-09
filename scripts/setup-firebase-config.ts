import { prisma } from '@/lib/db/prisma'

/**
 * Script to add Firebase configuration to admin settings
 * Run: npx tsx scripts/setup-firebase-config.ts
 */

async function setupFirebaseConfig() {
  console.log('🔥 Setting up Firebase configuration in admin settings...\n')

  const firebaseConfig = {
    FIREBASE_API_KEY: 'AIzaSyCY3I7IDyAH3-pHRNDSB0614jY8ptjI-eI',
    FIREBASE_AUTH_DOMAIN: 'argu-fight.firebaseapp.com',
    FIREBASE_PROJECT_ID: 'argu-fight',
    FIREBASE_STORAGE_BUCKET: 'argu-fight.firebasestorage.app',
    FIREBASE_MESSAGING_SENDER_ID: '563658606120',
    FIREBASE_APP_ID: '1:563658606120:web:0cd5fd76b2a9cc7be5571d',
    // Note: Server Key and VAPID Key need to be added manually from Firebase Console
    // FIREBASE_SERVER_KEY: 'AAAA...' (from Firebase Console → Project Settings → Cloud Messaging → Server key)
    // FIREBASE_VAPID_KEY: 'BK...' (from Firebase Console → Project Settings → Cloud Messaging → Web Push certificates)
  }

  try {
    for (const [key, value] of Object.entries(firebaseConfig)) {
      await prisma.adminSetting.upsert({
        where: { key },
        update: { value, encrypted: false },
        create: { key, value, encrypted: false },
      })
      console.log(`✅ ${key}: ${value.substring(0, 20)}...`)
    }

    console.log('\n✅ Firebase configuration added successfully!')
    console.log('\n⚠️  IMPORTANT: You still need to add:')
    console.log('   1. FIREBASE_SERVER_KEY - From Firebase Console → Project Settings → Cloud Messaging → Server key')
    console.log('   2. FIREBASE_VAPID_KEY - From Firebase Console → Project Settings → Cloud Messaging → Web Push certificates → Generate key pair')
    console.log('\n   Add these manually in Admin Dashboard → Settings → Firebase Push Notifications')
    console.log('\n📝 Next steps:')
    console.log('   1. Get Server Key and VAPID Key from Firebase Console')
    console.log('   2. Add them to Admin Settings')
    console.log('   3. Apply database migration: psql $DATABASE_URL -f prisma/migrations/20251210000000_add_fcm_tokens/migration.sql')
    console.log('   4. Test push notifications!')

  } catch (error: any) {
    console.error('❌ Error setting up Firebase config:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupFirebaseConfig()

