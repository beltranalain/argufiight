import { redirect } from 'next/navigation'
import { verifySessionWithDb } from '@/lib/auth/session-verify'
import { PublicHomepage } from '@/components/homepage/PublicHomepage'
import { DashboardHomePage } from '@/components/dashboard/DashboardHomePage'

export default async function RootPage() {
  // Use verifySessionWithDb to get full session with userId
  const session = await verifySessionWithDb()

  // If logged in, show dashboard
  if (session?.userId) {
    return <DashboardHomePage />
  }

  // If not logged in, show public homepage
  return <PublicHomepage />
}
