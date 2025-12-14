import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'
import { sendPushNotifications } from '@/lib/firebase/fcm-client'

// POST /api/fcm/send - Send push notification to user(s)
export async function POST(request: NextRequest) {
  try {
    // Verify admin (only admins can manually send push notifications)
    const userId = await verifyAdmin()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requestBody = await request.json()
    const { userIds, title, body, data } = requestBody

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'userIds array is required' },
        { status: 400 }
      )
    }

    if (!title || !body) {
      return NextResponse.json(
        { error: 'title and body are required' },
        { status: 400 }
      )
    }

    // Get FCM tokens for all users
    const tokens = await prisma.fCMToken.findMany({
      where: {
        userId: { in: userIds },
      },
      select: {
        token: true,
      },
    })

    if (tokens.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No FCM tokens found for these users',
      })
    }

    // Send push notifications
    const result = await sendPushNotifications(
      tokens.map((t) => t.token),
      {
        title,
        body,
        data: data || {},
      }
    )

    // Check if the error is about missing service account
    if (result.success === 0 && result.errors.length > 0) {
      const hasServiceAccountError = result.errors.some(err => 
        err.includes('Service Account not configured') || 
        err.includes('OAuth2 not configured')
      )
      
      if (hasServiceAccountError) {
        return NextResponse.json({
          success: false,
          sent: 0,
          failed: tokens.length,
          errors: result.errors,
          message: 'Firebase Service Account not configured. Please go to Admin Settings → Firebase Push Notifications and add your Service Account JSON.',
        })
      }
    }

    return NextResponse.json({
      success: result.success > 0,
      sent: result.success,
      failed: result.failed,
      errors: result.errors,
    })
  } catch (error: any) {
    console.error('Failed to send push notification:', error)
    return NextResponse.json(
      { error: 'Failed to send push notification' },
      { status: 500 }
    )
  }
}

