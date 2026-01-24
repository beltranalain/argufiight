import { prisma } from '../lib/db/prisma'

async function initializeVAPIDSettings() {
  console.log('Initializing VAPID notification settings...')

  try {
    // Get VAPID keys from environment or use placeholders
    const publicKey = process.env.VAPID_PUBLIC_KEY || ''
    const privateKey = process.env.VAPID_PRIVATE_KEY || ''

    if (!publicKey || !privateKey) {
      console.warn('⚠️  VAPID keys not found in environment variables.')
      console.warn('   Run: node scripts/generate-vapid-keys.js')
      console.warn('   Then add the keys to your .env file and run this script again.')
      process.exit(1)
    }

    // Create or update VAPID_PUBLIC_KEY setting
    await prisma.adminSetting.upsert({
      where: { key: 'VAPID_PUBLIC_KEY' },
      update: {
        value: publicKey,
      },
      create: {
        key: 'VAPID_PUBLIC_KEY',
        value: publicKey,
        description: 'VAPID public key for Web Push notifications',
        category: 'notifications',
        updatedBy: 'SYSTEM',
      },
    })

    console.log('✅ VAPID_PUBLIC_KEY setting initialized')

    // Create or update VAPID_PRIVATE_KEY setting
    await prisma.adminSetting.upsert({
      where: { key: 'VAPID_PRIVATE_KEY' },
      update: {
        value: privateKey,
      },
      create: {
        key: 'VAPID_PRIVATE_KEY',
        value: privateKey,
        description: 'VAPID private key for Web Push notifications (keep secret!)',
        category: 'notifications',
        updatedBy: 'SYSTEM',
      },
    })

    console.log('✅ VAPID_PRIVATE_KEY setting initialized')

    // Initialize notification type defaults
    const notificationTypes = [
      { key: 'NOTIFICATION_DEBATE_TURN_ENABLED', value: 'true', description: 'Enable turn notifications' },
      { key: 'NOTIFICATION_DEBATE_VERDICT_ENABLED', value: 'true', description: 'Enable verdict notifications' },
      { key: 'NOTIFICATION_NEW_CHALLENGE_ENABLED', value: 'true', description: 'Enable new challenge notifications' },
      { key: 'NOTIFICATION_BELT_CHALLENGE_ENABLED', value: 'true', description: 'Enable belt challenge notifications' },
    ]

    for (const setting of notificationTypes) {
      await prisma.adminSetting.upsert({
        where: { key: setting.key },
        update: {},
        create: {
          key: setting.key,
          value: setting.value,
          description: setting.description,
          category: 'notifications',
          updatedBy: 'SYSTEM',
        },
      })
      console.log(`✅ ${setting.key} initialized`)
    }

    console.log('\n🎉 VAPID notification settings initialization complete!')
    console.log('\nNext steps:')
    console.log('1. Users can now subscribe to push notifications')
    console.log('2. Make sure your service worker (public/sw.js) is configured')
    console.log('3. Test notifications by submitting a debate statement')
  } catch (error) {
    console.error('❌ Failed to initialize VAPID settings:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

initializeVAPIDSettings()
  .then(() => {
    console.log('\nScript finished successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })
