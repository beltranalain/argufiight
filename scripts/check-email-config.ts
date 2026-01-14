import { prisma } from '../lib/db/prisma'
import { createResendClient } from '../lib/email/resend'
import { sendAdvertiserApprovalEmail, sendAdvertiserRejectionEmail } from '../lib/email/advertiser-notifications'

async function checkEmailConfig() {
  console.log('\n=== Checking Email Configuration ===\n')

  // 1. Check Resend API Key
  console.log('1. Checking Resend API Key...')
  try {
    const setting = await prisma.adminSetting.findUnique({
      where: { key: 'RESEND_API_KEY' },
    })

    if (setting) {
      console.log('   ✅ Found RESEND_API_KEY in admin settings')
      console.log(`   Key starts with: ${setting.value.substring(0, 10)}...`)
    } else {
      console.log('   ⚠️  RESEND_API_KEY not found in admin settings')
    }

    const envKey = process.env.RESEND_API_KEY
    if (envKey) {
      console.log('   ✅ Found RESEND_API_KEY in environment variables')
      console.log(`   Key starts with: ${envKey.substring(0, 10)}...`)
    } else {
      console.log('   ⚠️  RESEND_API_KEY not found in environment variables')
    }
  } catch (error: any) {
    console.error('   ❌ Error checking Resend key:', error.message)
  }

  // 2. Test Resend Client Creation
  console.log('\n2. Testing Resend Client Creation...')
  try {
    const resend = await createResendClient()
    if (resend) {
      console.log('   ✅ Resend client created successfully')
    } else {
      console.log('   ❌ Failed to create Resend client (no API key found)')
    }
  } catch (error: any) {
    console.error('   ❌ Error creating Resend client:', error.message)
  }

  // 3. Check Recent Email Usage
  console.log('\n3. Checking Recent Email Usage...')
  try {
    const emailUsage = await prisma.apiUsage.findMany({
      where: {
        provider: 'resend',
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    if (emailUsage.length > 0) {
      console.log(`   ✅ Found ${emailUsage.length} email usage records:`)
      emailUsage.forEach((usage, index) => {
        console.log(`   ${index + 1}. ${usage.success ? '✅' : '❌'} ${usage.createdAt.toLocaleString()} - ${usage.metadata?.type || 'unknown'}`)
        if (!usage.success && usage.errorMessage) {
          console.log(`      Error: ${usage.errorMessage}`)
        }
      })
    } else {
      console.log('   ⚠️  No email usage records found')
    }
  } catch (error: any) {
    console.error('   ❌ Error checking email usage:', error.message)
  }

  // 4. Check Recent Advertiser Approvals/Rejections
  console.log('\n4. Checking Recent Advertiser Actions...')
  try {
    const recentApprovals = await prisma.advertiser.findMany({
      where: {
        status: 'APPROVED',
        approvedAt: {
          not: null,
        },
      },
      orderBy: { approvedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        companyName: true,
        contactEmail: true,
        approvedAt: true,
      },
    })

    if (recentApprovals.length > 0) {
      console.log(`   ✅ Found ${recentApprovals.length} recently approved advertisers:`)
      recentApprovals.forEach((adv, index) => {
        console.log(`   ${index + 1}. ${adv.companyName} (${adv.contactEmail}) - Approved: ${adv.approvedAt?.toLocaleString()}`)
      })
    } else {
      console.log('   ⚠️  No recently approved advertisers found')
    }

    const recentRejections = await prisma.advertiser.findMany({
      where: {
        status: 'REJECTED',
        rejectionReason: {
          not: null,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        companyName: true,
        contactEmail: true,
        createdAt: true,
      },
    })

    if (recentRejections.length > 0) {
      console.log(`   ✅ Found ${recentRejections.length} recently rejected advertisers:`)
      recentRejections.forEach((adv, index) => {
        console.log(`   ${index + 1}. ${adv.companyName} (${adv.contactEmail}) - Rejected: ${adv.createdAt.toLocaleString()}`)
      })
    } else {
      console.log('   ⚠️  No recently rejected advertisers found')
    }
  } catch (error: any) {
    console.error('   ❌ Error checking advertiser actions:', error.message)
  }

  console.log('\n=== Summary ===')
  console.log('If emails are not being sent, check:')
  console.log('1. RESEND_API_KEY is configured in admin settings or .env')
  console.log('2. Resend API key is valid (check Resend dashboard)')
  console.log('3. Server console logs for email errors')
  console.log('4. Email usage records in API Usage tab')
}

checkEmailConfig()
  .catch((e) => {
    console.error('❌ Script failed:', e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
