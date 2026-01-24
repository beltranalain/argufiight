/**
 * Generate VAPID keys for Web Push notifications
 * Run with: node scripts/generate-vapid-keys.js
 */

import webpush from 'web-push'

console.log('Generating VAPID keys for Web Push notifications...\n')

const vapidKeys = webpush.generateVAPIDKeys()

console.log('✅ VAPID keys generated successfully!\n')
console.log('Add these to your .env file:\n')
console.log(`VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"`)
console.log(`VAPID_PRIVATE_KEY="${vapidKeys.privateKey}"`)
console.log('\n📋 Copy the lines above and add them to your .env file')
console.log('\nNOTE: These keys should also be added to your Admin Settings database')
console.log('      so they can be managed through the admin panel.')
