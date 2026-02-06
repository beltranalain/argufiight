import { verifySessionWithDb } from '@/lib/auth/session-verify'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await verifySessionWithDb()

  if (!session?.userId) {
    redirect('/login')
  }

  // Check if user is an advertiser and redirect them
  // session.user.email is already available from verifySessionWithDb — no extra DB query needed
  if (session.user.email) {
    const advertiser = await prisma.advertiser.findUnique({
      where: { contactEmail: session.user.email },
      select: { status: true },
    })

    if (advertiser) {
      redirect('/advertiser/dashboard')
    }
  }

  return <>{children}</>
}

// This layout makes the dashboard route group require authentication
// The page.tsx inside will be accessible at "/" when logged in

