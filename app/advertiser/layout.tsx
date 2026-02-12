import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/auth/session'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'
import { headers } from 'next/headers'
import { requireFeature } from '@/lib/features'

export default async function AdvertiserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Gate: redirect home if advertising module is disabled
  await requireFeature('ADVERTISING')

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

  // Fetch user data + latest session in parallel (was 4 sequential queries)
  const [user, latestSession] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, totpEnabled: true },
    }),
    prisma.session.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { twoFactorVerified: true },
    }),
  ])

  if (!user) {
    redirect('/login?userType=advertiser')
  }

  // Check if user is an approved advertiser
  const advertiser = await prisma.advertiser.findUnique({
    where: { contactEmail: user.email },
    select: { status: true },
  })

  // If advertiser is approved, check 2FA
  if (advertiser?.status === 'APPROVED') {
    if (user.totpEnabled && !latestSession?.twoFactorVerified) {
      redirect('/verify-2fa?userId=' + userId)
    }
  }

  return <>{children}</>
}

