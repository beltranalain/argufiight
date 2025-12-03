import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { Resend } from 'resend'
import { getUserIdFromSession } from '@/lib/auth/session-utils'

// POST /api/admin/settings/test-resend - Test Resend API connection
export async function POST(request: NextRequest) {
  try {
    const session = await verifySession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin
    const userId = getUserIdFromSession(session)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get Resend API key
    const setting = await prisma.adminSetting.findUnique({
      where: { key: 'RESEND_API_KEY' },
    })

    const apiKey = setting?.value || process.env.RESEND_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Resend API key not configured. Please add it in settings.',
        },
        { status: 400 }
      )
    }

    // Test the API key
    const resend = new Resend(apiKey)

    // Try to list API keys (this validates the key)
    const result = await resend.apiKeys.list()

    return NextResponse.json({
      success: true,
      message: 'API connection successful',
      apiKeysFound: Array.isArray(result.data) ? result.data.length : 0,
    })
  } catch (error: any) {
    console.error('Resend API test failed:', error)
    
    let errorMessage = 'Failed to connect to Resend API'
    if (error.status === 401 || error.message?.includes('Unauthorized')) {
      errorMessage = 'Invalid API key. Please check your Resend API key.'
    } else if (error.message?.includes('not configured')) {
      errorMessage = 'Resend API key not configured. Please add it in settings.'
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMessage = 'Network error. Please check your internet connection.'
    }

    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        details: error.message 
      },
      { status: 500 }
    )
  }
}

