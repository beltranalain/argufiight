import { PrismaClient } from '@prisma/client'
import OpenAI from 'openai'

const prisma = new PrismaClient()

async function testDeepSeekKey() {
  try {
    console.log('🔍 Checking DeepSeek API Key configuration...\n')

    // Check admin settings
    const setting = await prisma.adminSetting.findUnique({
      where: { key: 'DEEPSEEK_API_KEY' },
    })

    if (setting) {
      console.log('✅ Found API key in admin settings')
      console.log(`   Key: ${setting.value.substring(0, 10)}...${setting.value.substring(setting.value.length - 4)}`)
    } else {
      console.log('⚠️  No API key found in admin settings')
    }

    // Check environment variable
    const envKey = process.env.DEEPSEEK_API_KEY
    if (envKey) {
      console.log('✅ Found API key in environment variables')
      console.log(`   Key: ${envKey.substring(0, 10)}...${envKey.substring(envKey.length - 4)}`)
    } else {
      console.log('⚠️  No API key found in environment variables')
    }

    // Determine which key to use
    const apiKey = setting?.value || envKey

    if (!apiKey) {
      console.log('\n❌ No DeepSeek API key found!')
      console.log('   Please add it in Admin Settings or set DEEPSEEK_API_KEY environment variable')
      return
    }

    console.log('\n🧪 Testing API connection...\n')

    // Test the API key
    const client = new OpenAI({
      apiKey,
      baseURL: 'https://api.deepseek.com',
    })

    const testPrompt = 'Say "API connection successful" if you can read this.'

    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: testPrompt,
        },
      ],
      max_tokens: 50,
    })

    const response = completion.choices[0].message.content

    console.log('✅ API Connection Successful!')
    console.log(`   Response: ${response}`)
    console.log(`   Model: ${completion.model}`)
    console.log(`   Tokens used: ${completion.usage?.total_tokens || 'N/A'}`)
    console.log('\n🎉 DeepSeek API key is working correctly!')
  } catch (error: any) {
    console.error('\n❌ API Test Failed!')
    console.error(`   Error: ${error.message}`)
    
    if (error.status === 401) {
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

testDeepSeekKey()










