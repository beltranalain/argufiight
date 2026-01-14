import { prisma } from '../lib/db/prisma'
import { getResendKey } from '../lib/email/resend'

async function checkAdvertiserAndEmail() {
  console.log('\n=== Checking Advertiser & Email Status ===\n')

  try {
    // Check Resend API key
    console.log('1. Checking Resend API Key...')
    const resendKey = await getResendKey()
    if (resendKey) {
      console.log('   ✅ Resend API key found:', resendKey.substring(0, 10) + '...')
    } else {
      console.log('   ❌ Resend API key NOT found')
      console.log('   ⚠️  Emails will not be sent without API key')
      console.log('   📋 Set it in Admin Settings or .env as RESEND_API_KEY')
    }

    // Check recent advertisers
    console.log('\n2. Checking Recent Advertisers...')
    const advertisers = await prisma.advertiser.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        companyName: true,
        contactEmail: true,
        status: true,
        createdAt: true,
      },
    })

    if (advertisers.length === 0) {
      console.log('   ❌ No advertisers found in database')
    } else {
      console.log(`   ✅ Found ${advertisers.length} advertiser(s):`)
      advertisers.forEach((adv, i) => {
        console.log(`   ${i + 1}. ${adv.companyName} (${adv.contactEmail}) - ${adv.status}`)
        console.log(`      Created: ${adv.createdAt}`)
      })
    }

    // Check API usage for emails
    console.log('\n3. Checking Email API Usage...')
    const emailUsage = await prisma.apiUsage.findMany({
      where: {
        provider: 'resend',
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        endpoint: true,
        success: true,
        createdAt: true,
        metadata: true,
      },
    })

    if (emailUsage.length === 0) {
      console.log('   ❌ No email API usage records found')
      console.log('   ⚠️  This means no emails have been sent through Resend')
    } else {
      console.log(`   ✅ Found ${emailUsage.length} email usage record(s):`)
      emailUsage.forEach((usage, i) => {
        console.log(`   ${i + 1}. ${usage.endpoint} - ${usage.success ? '✅ Success' : '❌ Failed'}`)
        console.log(`      Created: ${usage.createdAt}`)
        if (usage.metadata) {
          const meta = usage.metadata as any
          if (meta.to) console.log(`      To: ${meta.to}`)
          if (meta.type) console.log(`      Type: ${meta.type}`)
        }
      })
    }

    // Check admin settings for Resend key
    console.log('\n4. Checking Admin Settings...')
    const resendSetting = await prisma.adminSetting.findUnique({
      where: { key: 'RESEND_API_KEY' },
      select: {
        key: true,
        value: true,
        updatedAt: true,
      },
    })

    if (resendSetting) {
      console.log('   ✅ RESEND_API_KEY found in admin settings')
      console.log(`      Updated: ${resendSetting.updatedAt}`)
    } else {
      console.log('   ❌ RESEND_API_KEY not found in admin settings')
      console.log('   📋 Add it in Admin → Settings')
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdvertiserAndEmail()
