import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { AdminNav } from '@/components/admin/AdminNav'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import { NotificationTicker } from '@/components/notifications/NotificationTicker'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await verifySession()

  if (!session) {
    redirect('/login?userType=employee')
  }

  // Check if user is admin
  const userId = getUserIdFromSession(session)
  if (!userId) {
    redirect('/login?userType=employee')
  }
  
  // Single query: fetch admin status + 2FA + latest session in parallel
  const [user, latestSession] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true, totpEnabled: true },
    }),
    prisma.session.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { twoFactorVerified: true },
    }),
  ])

  if (!user?.isAdmin) {
    redirect('/')
  }

  // Check if 2FA is required and verified for this session
  if (user.totpEnabled && !latestSession?.twoFactorVerified) {
    redirect('/verify-2fa?userId=' + userId)
  }

  return (
    <div className="flex h-screen bg-black">
      <AdminNav />
      <main className="flex-1 overflow-y-auto p-8">
        <NotificationTicker />
        {children}
      </main>
    </div>
  )
}

