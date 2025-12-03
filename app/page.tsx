import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/auth/session'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import { PublicHomepage } from '@/components/homepage/PublicHomepage'
import { DashboardHomePage } from '@/components/dashboard/DashboardHomePage'

export default async function RootPage() {
  const session = await verifySession()
  const userId = getUserIdFromSession(session)

  // If logged in, show dashboard
  if (userId) {
    return <DashboardHomePage />
  }

  // If not logged in, show public homepage
  return <PublicHomepage />
}
