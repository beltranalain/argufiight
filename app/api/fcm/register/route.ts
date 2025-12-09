import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'

// POST /api/fcm/register - Register FCM token for push notifications
export async function POST(request: NextRequest) {
  try {
    const session = await verifySession()
    const userId = getUserIdFromSession(session)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { token, device, userAgent } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'FCM token is required' },
        { status: 400 }
      )
    }

    // Upsert FCM token (update if exists, create if new)
    await prisma.fCMToken.upsert({
      where: { token },
      update: {
        userId,
        device: device || null,
        userAgent: userAgent || null,
        updatedAt: new Date(),
      },
      create: {
        userId,
        token,
        device: device || null,
        userAgent: userAgent || null,
      },
    })

    console.log(`[FCM] Registered token for user ${userId}`)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to register FCM token:', error)
    return NextResponse.json(
      { error: 'Failed to register FCM token' },
      { status: 500 }
    )
  }
}

// DELETE /api/fcm/register - Unregister FCM token
export async function DELETE(request: NextRequest) {
  try {
    const session = await verifySession()
    const userId = getUserIdFromSession(session)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'FCM token is required' },
        { status: 400 }
      )
    }

    // Delete token (only if it belongs to this user)
    await prisma.fCMToken.deleteMany({
      where: {
        token,
        userId,
      },
    })

    console.log(`[FCM] Unregistered token for user ${userId}`)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to unregister FCM token:', error)
    return NextResponse.json(
      { error: 'Failed to unregister FCM token' },
      { status: 500 }
    )
  }
}

