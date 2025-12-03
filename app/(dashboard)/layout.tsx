import { verifySession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { getUserIdFromSession } from '@/lib/auth/session-utils'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await verifySession()

  if (!session || !getUserIdFromSession(session)) {
    redirect('/login')
  }

  return <>{children}</>
}

// This layout makes the dashboard route group require authentication
// The page.tsx inside will be accessible at "/" when logged in

