import { PrismaClient } from '@prisma/client'
import { Resend } from 'resend'

const prisma = new PrismaClient()

async function testResendKey() {
  try {
    console.log('🔍 Checking Resend API Key configuration...\n')

    // Check admin settings
    const setting = await prisma.adminSetting.findUnique({
      where: { key: 'RESEND_API_KEY' },
    })

    if (setting) {
      console.log('✅ Found API key in admin settings')
      console.log(`   Key: ${setting.value.substring(0, 10)}...${setting.value.substring(setting.value.length - 4)}`)
    } else {
      console.log('⚠️  No API key found in admin settings')
    }

    // Check environment variable
    const envKey = process.env.RESEND_API_KEY
    if (envKey) {
      console.log('✅ Found API key in environment variables')
      console.log(`   Key: ${envKey.substring(0, 10)}...${envKey.substring(envKey.length - 4)}`)
    } else {
      console.log('⚠️  No API key found in environment variables')
    }

    // Determine which key to use
    const apiKey = setting?.value || envKey

    if (!apiKey) {
      console.log('\n❌ No Resend API key found!')
      console.log('   Please add it in Admin Settings or set RESEND_API_KEY environment variable')
      return
    }

    console.log('\n🧪 Testing API connection...\n')

    // Test the API key
    const resend = new Resend(apiKey)

    // Try to get API key info (this will validate the key)
    const result = await resend.apiKeys.list()

    console.log('✅ API Connection Successful!')
    console.log(`   API Key is valid`)
    console.log(`   Found ${Array.isArray(result.data) ? result.data.length : 0} API keys`)
    console.log('\n🎉 Resend API key is working correctly!')
    console.log('\n💡 Note: To test sending an email, you would need to use resend.emails.send()')
  } catch (error: any) {
    console.error('\n❌ API Test Failed!')
    console.error(`   Error: ${error.message}`)
    
    if (error.status === 401 || error.message?.includes('Unauthorized')) {
      console.error('   This usually means the API key is invalid or expired.')
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error('   Network error - check your internet connection.')
    } else {
      console.error('   Full error:', error)
    }
  } finally {
    await prisma.$disconnect()
  }
}

testResendKey()

