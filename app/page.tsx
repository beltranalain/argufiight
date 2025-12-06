import { redirect } from 'next/navigation'
import { verifySessionWithDb } from '@/lib/auth/session-verify'
import { PublicHomepage } from '@/components/homepage/PublicHomepage'
import { DashboardHomePage } from '@/components/dashboard/DashboardHomePage'
import { prisma } from '@/lib/db/prisma'

export default async function RootPage() {
  // Use verifySessionWithDb to get full session with userId
  const session = await verifySessionWithDb()

  // Debug logging (remove in production if needed)
  if (process.env.NODE_ENV === 'development') {
    console.log('[RootPage] Session check:', {
      hasSession: !!session,
      userId: session?.userId,
    })
  }

  // If logged in, check if user is advertiser and redirect accordingly
  if (session?.userId) {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
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

    return <DashboardHomePage />
  }

  // If not logged in, show public homepage
  return <PublicHomepage />
}
