import { verifySession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await verifySession()

  if (!session || !getUserIdFromSession(session)) {
    redirect('/login')
  }

  // Check if user is an advertiser and redirect them
  const userId = getUserIdFromSession(session)
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    })

    if (user) {
      const advertiser = await prisma.advertiser.findUnique({
        where: { contactEmail: user.email },
        select: { status: true },
      })

      // If user is an approved advertiser, redirect to advertiser dashboard
      if (advertiser && advertiser.status === 'APPROVED') {
        redirect('/advertiser/dashboard')
      }
    }
  }

  return <>{children}</>
}

// This layout makes the dashboard route group require authentication
// The page.tsx inside will be accessible at "/" when logged in

