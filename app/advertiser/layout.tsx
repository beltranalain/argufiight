import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/auth/session'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'

export default async function AdvertiserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await verifySession()

  if (!session) {
    redirect('/login?userType=advertiser')
  }

  const userId = getUserIdFromSession(session)
  if (!userId) {
    redirect('/login?userType=advertiser')
  }

  // Get user's email to check if they're an advertiser
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  })

  if (!user) {
    redirect('/login?userType=advertiser')
  }

  // Check if user is an approved advertiser
  const advertiser = await prisma.advertiser.findUnique({
    where: { contactEmail: user.email },
    select: { status: true },
  })

  // If not an advertiser or not approved, redirect to login
  // The API route will handle showing appropriate error messages
  if (!advertiser || advertiser.status !== 'APPROVED') {
    // Don't redirect here - let the page handle it so it can show appropriate messages
    // But we'll still allow the page to load so it can show the error
  } else {
    // Check if 2FA is required and verified for this session
    const userWith2FA = await prisma.user.findUnique({
      where: { id: userId },
      select: { totpEnabled: true },
    })

    if (userWith2FA?.totpEnabled) {
      const currentSession = await prisma.session.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      })

      if (!currentSession?.twoFactorVerified) {
        redirect('/verify-2fa?userId=' + userId)
      }
    }
  }

  return <>{children}</>
}

