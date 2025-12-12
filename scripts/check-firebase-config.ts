import { prisma } from '@/lib/db/prisma'
import { getFirebaseConfig } from '@/lib/firebase/config'

/**
 * Script to check Firebase configuration
 */
async function checkFirebaseConfig() {
  console.log('🔍 Checking Firebase Configuration...\n')

  try {
    // Check admin settings
    const settings = await prisma.adminSetting.findMany({
      where: {
        key: {
          in: [
            'FIREBASE_API_KEY',
            'FIREBASE_AUTH_DOMAIN',
            'FIREBASE_PROJECT_ID',
            'FIREBASE_STORAGE_BUCKET',
            'FIREBASE_MESSAGING_SENDER_ID',
            'FIREBASE_APP_ID',
            'FIREBASE_VAPID_KEY',
          ],
        },
      },
    })

    const configMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>)

    console.log('📋 Admin Settings:')
    console.log(`  ✅ FIREBASE_API_KEY: ${configMap.FIREBASE_API_KEY ? 'Set (' + configMap.FIREBASE_API_KEY.substring(0, 20) + '...)' : '❌ MISSING'}`)
    console.log(`  ${configMap.FIREBASE_AUTH_DOMAIN ? '✅' : '❌'} FIREBASE_AUTH_DOMAIN: ${configMap.FIREBASE_AUTH_DOMAIN || 'MISSING'}`)
    console.log(`  ${configMap.FIREBASE_PROJECT_ID ? '✅' : '❌'} FIREBASE_PROJECT_ID: ${configMap.FIREBASE_PROJECT_ID || 'MISSING'}`)
    console.log(`  ${configMap.FIREBASE_STORAGE_BUCKET ? '✅' : '❌'} FIREBASE_STORAGE_BUCKET: ${configMap.FIREBASE_STORAGE_BUCKET || 'MISSING'}`)
    console.log(`  ${configMap.FIREBASE_MESSAGING_SENDER_ID ? '✅' : '❌'} FIREBASE_MESSAGING_SENDER_ID: ${configMap.FIREBASE_MESSAGING_SENDER_ID || 'MISSING'}`)
    console.log(`  ${configMap.FIREBASE_APP_ID ? '✅' : '❌'} FIREBASE_APP_ID: ${configMap.FIREBASE_APP_ID ? configMap.FIREBASE_APP_ID.substring(0, 30) + '...' : 'MISSING'}`)
    const vapidKey = configMap.FIREBASE_VAPID_KEY
    const vapidKeyValid = vapidKey && (vapidKey.startsWith('BK') || vapidKey.startsWith('BN'))
    console.log(`  ${vapidKeyValid ? '✅' : '❌'} FIREBASE_VAPID_KEY: ${vapidKey ? vapidKey.substring(0, 30) + '...' : '❌ MISSING (REQUIRED FOR WEB PUSH)'}`)
    if (vapidKey && !vapidKeyValid) {
      console.log(`     ⚠️  WARNING: VAPID key should start with "BK" or "BN". Current key starts with "${vapidKey.substring(0, 2)}"`)
      console.log(`     This might be the private key or a key from a different project.`)
    }

    console.log('\n📦 Config Helper:')
    const config = await getFirebaseConfig()
    if (config) {
      console.log('  ✅ Config retrieved successfully')
      console.log(`  Project ID: ${config.projectId}`)
      if (config.vapidKey) {
        const isValid = config.vapidKey.startsWith('BK') || config.vapidKey.startsWith('BN')
        console.log(`  VAPID Key: ${isValid ? '✅ Valid format (' : '❌ INVALID FORMAT ('}${config.vapidKey.substring(0, 30)}...)`)
        if (!isValid) {
          console.log(`     ⚠️  VAPID key should start with "BK" or "BN", but starts with "${config.vapidKey.substring(0, 2)}"`)
        }
      } else {
        console.log(`  VAPID Key: ❌ MISSING`)
      }
    } else {
      console.log('  ❌ Config is null - missing required fields')
    }

    console.log('\n⚠️  If VAPID key is missing:')
    console.log('  1. Go to Firebase Console → Project Settings → Cloud Messaging')
    console.log('  2. Scroll to "Web Push certificates" section')
    console.log('  3. Click "Generate key pair" if not already generated')
    console.log('  4. Copy the public key (starts with BK... or BN...)')
    console.log('  5. Add it in Admin Dashboard → Settings → Firebase Push Notifications → VAPID Key')
    console.log('\n⚠️  If Cloud Messaging API is not enabled:')
    console.log('  1. Go to Google Cloud Console → APIs & Services → Library')
    console.log('  2. Search for "Firebase Cloud Messaging API"')
    console.log('  3. Click "Enable" if not already enabled')

  } catch (error: any) {
    console.error('❌ Error checking Firebase config:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkFirebaseConfig()

