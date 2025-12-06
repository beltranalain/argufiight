import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'

// PUT /api/creator/settings - Update creator ad slot settings
export async function PUT(request: NextRequest) {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = getUserIdFromSession(session)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a creator
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isCreator: true },
    })

    if (!user || !user.isCreator) {
      return NextResponse.json(
        { error: 'Creator mode not enabled' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      profileBannerPrice,
      postDebatePrice,
      debateWidgetPrice,
      profileBannerAvailable,
      postDebateAvailable,
      debateWidgetAvailable,
    } = body

    // Update creator settings
    await prisma.user.update({
      where: { id: userId },
      data: {
        profileBannerPrice: profileBannerPrice !== null && profileBannerPrice !== undefined
          ? profileBannerPrice
          : null,
        postDebatePrice: postDebatePrice !== null && postDebatePrice !== undefined
          ? postDebatePrice
          : null,
        debateWidgetPrice: debateWidgetPrice !== null && debateWidgetPrice !== undefined
          ? debateWidgetPrice
          : null,
        profileBannerAvailable: profileBannerAvailable ?? true,
        postDebateAvailable: postDebateAvailable ?? true,
        debateWidgetAvailable: debateWidgetAvailable ?? true,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to update creator settings:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update settings' },
      { status: 500 }
    )
  }
}

