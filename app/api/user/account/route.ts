import { NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'
import { cookies } from 'next/headers'

// DELETE /api/user/account — permanently delete account and all associated data
export async function DELETE() {
  try {
    const session = await verifySession()
    const userId = getUserIdFromSession(session)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Delete user — Prisma cascading deletes handle related records
    await prisma.user.delete({ where: { id: userId } })

    // Clear session cookie
    const cookieStore = await cookies()
    cookieStore.delete('session')

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[user/account] DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
