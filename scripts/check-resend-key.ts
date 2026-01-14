import { prisma } from '../lib/db/prisma'
import { getResendKey, createResendClient } from '../lib/email/resend'

async function checkResendKey() {
  console.log('\n=== Checking Resend API Key ===\n')

  try {
    // Check database
    const setting = await prisma.adminSetting.findUnique({
      where: { key: 'RESEND_API_KEY' },
    })

    if (setting) {
      console.log('✅ Found RESEND_API_KEY in database:')
      console.log(`   Key length: ${setting.value.length}`)
      console.log(`   Key starts with: ${setting.value.substring(0, 15)}...`)
      console.log(`   Key ends with: ...${setting.value.substring(setting.value.length - 10)}`)
      console.log(`   Encrypted flag: ${setting.encrypted}`)
      console.log(`   Updated at: ${setting.updatedAt}`)
    } else {
      console.log('❌ RESEND_API_KEY not found in database')
    }

    // Check environment
    if (process.env.RESEND_API_KEY) {
      console.log('\n✅ Found RESEND_API_KEY in environment:')
      console.log(`   Key length: ${process.env.RESEND_API_KEY.length}`)
      console.log(`   Key starts with: ${process.env.RESEND_API_KEY.substring(0, 15)}...`)
    } else {
      console.log('\n❌ RESEND_API_KEY not found in environment')
    }

    // Test getResendKey function
    console.log('\n--- Testing getResendKey() ---')
    const retrievedKey = await getResendKey()
    if (retrievedKey) {
      console.log(`✅ Retrieved key length: ${retrievedKey.length}`)
      console.log(`   Key starts with: ${retrievedKey.substring(0, 15)}...`)
      
      // Check for whitespace issues
      if (retrievedKey !== retrievedKey.trim()) {
        console.warn('⚠️  WARNING: Key has leading/trailing whitespace!')
        console.log(`   Original length: ${retrievedKey.length}`)
        console.log(`   Trimmed length: ${retrievedKey.trim().length}`)
      }
    } else {
      console.log('❌ getResendKey() returned null')
    }

    // Test createResendClient
    console.log('\n--- Testing createResendClient() ---')
    const client = await createResendClient()
    if (client) {
      console.log('✅ Resend client created successfully')
      
      // Try to list API keys (this validates the key)
      try {
        const result = await client.apiKeys.list()
        console.log('✅ API key validation successful (apiKeys.list worked)')
        console.log(`   Found ${Array.isArray(result.data) ? result.data.length : 0} API keys`)
      } catch (error: any) {
        console.error('❌ API key validation failed:', error.message)
        if (error.status === 401) {
          console.error('   Status 401: API key is invalid or unauthorized')
        }
      }
    } else {
      console.log('❌ Failed to create Resend client')
    }

  } catch (error: any) {
    console.error('\n❌ Error checking Resend key:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

checkResendKey()
