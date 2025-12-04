import { redirect } from 'next/navigation'
import { verifySessionWithDb } from '@/lib/auth/session-verify'
import { PublicHomepage } from '@/components/homepage/PublicHomepage'
import { DashboardHomePage } from '@/components/dashboard/DashboardHomePage'

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

  // If logged in, show dashboard
  if (session?.userId) {
    return <DashboardHomePage />
  }

  // If not logged in, show public homepage
  return <PublicHomepage />
}
