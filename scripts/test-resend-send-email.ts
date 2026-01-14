import { prisma } from '../lib/db/prisma'
import { createResendClient, getResendFromEmail } from '../lib/email/resend'

async function testResendSendEmail() {
  console.log('\n=== Testing Resend Email Sending ===\n')

  try {
    // Get API key info
    const apiKey = await import('../lib/email/resend').then(m => m.getResendKey())
    if (!apiKey) {
      console.log('❌ No API key found')
      return
    }
    console.log(`✅ API Key found: ${apiKey.substring(0, 15)}...`)

    // Create client
    const resend = await createResendClient()
    if (!resend) {
      console.log('❌ Failed to create Resend client')
      return
    }
    console.log('✅ Resend client created')

    // Get from email
    const fromEmail = await getResendFromEmail()
    console.log(`✅ From email: ${fromEmail}`)

    // Test sending an email to a test address
    console.log('\n--- Attempting to send test email ---')
    const testEmail = 'test@example.com' // Change this to your email for testing
    console.log(`Sending to: ${testEmail}`)

    const result = await resend.emails.send({
      from: fromEmail,
      to: testEmail,
      subject: 'Test Email from Argu Fight',
      html: '<p>This is a test email to verify the API key has send permissions.</p>',
    })

    if (result.error) {
      console.error('\n❌ Email send failed:')
      console.error(`   Error: ${result.error.message}`)
      console.error(`   Status Code: ${result.error.statusCode}`)
      console.error(`   Name: ${result.error.name}`)
      
      if (result.error.statusCode === 401) {
        console.error('\n⚠️  This means the API key is invalid or does not have permission to send emails.')
        console.error('   Solution:')
        console.error('   1. Go to https://resend.com/api-keys')
        console.error('   2. Check if your API key has "Full Access" or "Send Emails" permission')
        console.error('   3. If not, create a new API key with the right permissions')
        console.error('   4. Update the key in Admin Settings')
      }
    } else {
      console.log('\n✅ Email sent successfully!')
      console.log(`   Email ID: ${result.data?.id}`)
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

testResendSendEmail()
