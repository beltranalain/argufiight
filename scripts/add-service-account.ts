import { prisma } from '@/lib/db/prisma'
import * as fs from 'fs'

/**
 * Script to add Firebase Service Account JSON to admin settings
 * 
 * Usage:
 *   npx tsx scripts/add-service-account.ts <path-to-service-account.json>
 * 
 * Or paste the JSON directly:
 *   npx tsx scripts/add-service-account.ts
 */

async function addServiceAccount() {
  let serviceAccountJson: string

  // Get JSON from command line argument (file path) or stdin
  if (process.argv[2]) {
    // Read from file
    const filePath = process.argv[2]
    try {
      serviceAccountJson = fs.readFileSync(filePath, 'utf-8')
      // Validate it's valid JSON
      JSON.parse(serviceAccountJson)
    } catch (error: any) {
      console.error('❌ Error reading or parsing JSON file:', error.message)
      process.exit(1)
    }
  } else {
    console.log('📝 Please provide the path to your Service Account JSON file:')
    console.log('   Usage: npx tsx scripts/add-service-account.ts <path-to-json-file>')
    console.log('\n💡 To get the Service Account JSON:')
    console.log('   1. Go to Firebase Console → Project Settings → Service Accounts')
    console.log('   2. Click "Generate new private key"')
    console.log('   3. Download the JSON file')
    console.log('   4. Run: npx tsx scripts/add-service-account.ts <path-to-downloaded-file>')
    process.exit(1)
  }

  console.log('🔥 Adding Firebase Service Account to admin settings...\n')

  try {
    // Validate JSON structure
    const serviceAccount = JSON.parse(serviceAccountJson)
    if (!serviceAccount.client_email || !serviceAccount.private_key || !serviceAccount.project_id) {
      console.error('❌ Invalid Service Account JSON. Missing required fields.')
      process.exit(1)
    }

    // Store in database
    await prisma.adminSetting.upsert({
      where: { key: 'FIREBASE_SERVICE_ACCOUNT' },
      update: { value: serviceAccountJson, encrypted: true },
      create: { key: 'FIREBASE_SERVICE_ACCOUNT', value: serviceAccountJson, encrypted: true },
    })

    console.log(`✅ FIREBASE_SERVICE_ACCOUNT: Added successfully`)
    console.log(`   Project ID: ${serviceAccount.project_id}`)
    console.log(`   Client Email: ${serviceAccount.client_email}`)

    console.log('\n✅ Service Account added successfully!')
    console.log('\n📝 Next steps:')
    console.log('   1. Apply database migration: psql $DATABASE_URL -f prisma/migrations/20251210000000_add_fcm_tokens/migration.sql')
    console.log('   2. Test push notifications!')
    console.log('\n💡 The code will now use V1 API (Service Account) instead of Legacy API (Server Key)')

  } catch (error: any) {
    console.error('❌ Error adding Service Account:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addServiceAccount()

