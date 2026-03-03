import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'

// PATCH /api/user/profile — update username and bio
export async function PATCH(request: NextRequest) {
  try {
    const session = await verifySession()
    const userId  = getUserIdFromSession(session)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { username, bio } = await request.json()

    if (username !== undefined) {
      if (typeof username !== 'string' || username.trim().length < 2) {
        return NextResponse.json({ error: 'Username must be at least 2 characters' }, { status: 400 })
      }
      // Check uniqueness (exclude self)
      const existing = await prisma.user.findFirst({
        where: { username: username.trim(), id: { not: userId } },
      })
      if (existing) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
      }
    }

    const data: Record<string, string> = {}
    if (username !== undefined) data.username = username.trim()
    if (bio !== undefined) data.bio = bio

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, username: true, bio: true, avatarUrl: true },
    })

    return NextResponse.json({ user: updated })
  } catch (err) {
    console.error('[user/profile] PATCH error:', err)
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
  }
}
