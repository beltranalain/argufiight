import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth/session-utils'
import { sendAdvertiserApprovalEmail, sendAdvertiserRejectionEmail } from '@/lib/email/advertiser-notifications'

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAdmin()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, type } = body

    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 })
    }

    const testName = 'Test Advertiser'
    const testCompany = 'Test Company Inc.'

    let result = false
    let message = ''

    if (type === 'approval') {
      result = await sendAdvertiserApprovalEmail(email, testName, testCompany)
      message = result 
        ? 'Approval email sent successfully!' 
        : 'Failed to send approval email. Check Resend API key configuration.'
    } else if (type === 'rejection') {
      result = await sendAdvertiserRejectionEmail(
        email,
        testName,
        testCompany,
        'This is a test rejection. Your application did not meet our current requirements.'
      )
      message = result 
        ? 'Rejection email sent successfully!' 
        : 'Failed to send rejection email. Check Resend API key configuration.'
    } else {
      return NextResponse.json({ error: 'Invalid type. Use "approval" or "rejection"' }, { status: 400 })
    }

    return NextResponse.json({
      success: result,
      message,
    })
  } catch (error: any) {
    console.error('Failed to send test email:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send test email' },
      { status: 500 }
    )
  }
}

