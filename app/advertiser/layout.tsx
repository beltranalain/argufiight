import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/auth/session'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'
import { headers } from 'next/headers'

export default async function AdvertiserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get the current pathname to check if this is the payment success route
  // Try multiple header sources since middleware might not always set it
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || 
                   headersList.get('x-invoke-path') || 
                   ''
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Advertiser Layout] Checking pathname:', {
      'x-pathname': headersList.get('x-pathname'),
      'x-invoke-path': headersList.get('x-invoke-path'),
      'all-x-headers': Array.from(headersList.entries())
        .filter(([k]) => k.toLowerCase().startsWith('x-'))
        .map(([k, v]) => `${k}: ${v}`)
        .join(', '),
    })
  }
  
  // Allow payment success route to proceed without auth (it uses Stripe metadata for verification)
  // This route is accessed after Stripe redirect where session cookies may be lost
  const isPaymentSuccessRoute = pathname && (
    pathname.includes('/advertiser/campaigns/payment/success') ||
    pathname.includes('payment/success')
  )
  
  if (isPaymentSuccessRoute) {
    console.log('[Advertiser Layout] Payment success route detected, skipping auth check. Pathname:', pathname)
    // Payment success route doesn't require auth - it verifies via Stripe metadata
    return <>{children}</>
  }

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
      // Check if 2FA is enabled and verified for this session
      // Note: 2FA is optional for advertisers (can be enabled/disabled)
      const userWith2FA = await prisma.user.findUnique({
        where: { id: userId },
        select: { totpEnabled: true },
      })

      // Only require 2FA verification if 2FA is actually enabled
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

