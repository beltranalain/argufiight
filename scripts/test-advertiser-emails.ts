import { sendAdvertiserApprovalEmail, sendAdvertiserRejectionEmail } from '../lib/email/advertiser-notifications'

async function testEmails() {
  const testEmail = 'info@argufight.com'
  const testName = 'Test Advertiser'
  const testCompany = 'Test Company Inc.'

  console.log('📧 Testing advertiser email notifications...\n')

  try {
    // Test approval email
    console.log('1️⃣ Sending approval email...')
    const approvalResult = await sendAdvertiserApprovalEmail(
      testEmail,
      testName,
      testCompany
    )
    
    if (approvalResult) {
      console.log('✅ Approval email sent successfully!')
    } else {
      console.log('❌ Failed to send approval email (check Resend API key)')
    }

    // Wait a bit before sending the next email
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Test rejection email
    console.log('\n2️⃣ Sending rejection email...')
    const rejectionResult = await sendAdvertiserRejectionEmail(
      testEmail,
      testName,
      testCompany,
      'This is a test rejection reason. Your application did not meet our current requirements.'
    )
    
    if (rejectionResult) {
      console.log('✅ Rejection email sent successfully!')
    } else {
      console.log('❌ Failed to send rejection email (check Resend API key)')
    }

    console.log('\n📬 Check your inbox at:', testEmail)
    console.log('   (Also check spam folder if not received)')

  } catch (error: any) {
    console.error('❌ Error sending test emails:', error.message)
    console.error('\n💡 Make sure:')
    console.error('   1. RESEND_API_KEY is set in environment variables or admin settings')
    console.error('   2. The email address is valid')
    console.error('   3. Resend API key has proper permissions')
  }
}

testEmails()

