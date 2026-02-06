import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import { ToastProvider } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ThemeProvider } from '@/lib/contexts/ThemeContext'
import { ChallengeProvider } from '@/lib/contexts/ChallengeContext'
import { ChallengeModal } from '@/components/challenge/ChallengeModal'
import { NotificationTicker } from '@/components/notifications/NotificationTicker'
import { PushNotificationManager } from '@/components/notifications/PushNotificationManager'
import { prisma } from '@/lib/db/prisma'
import { OrganizationSchema, WebsiteSearchSchema } from '@/components/seo/StructuredData'

export const metadata: Metadata = {
  title: 'Argu Fight - AI-Judged Debate Platform',
  description: 'The world\'s first debate platform with AI judges. Engage in structured debates, get judged by AI personalities, and climb the ELO leaderboard.',
  keywords: 'debate, AI, artificial intelligence, ELO, competition, argumentation, judges',
  authors: [{ name: 'Argu Fight' }],
  creator: 'Argu Fight',
  publisher: 'Argu Fight',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://www.argufight.com',
    title: 'Argu Fight - AI-Judged Debate Platform',
    description: 'Engage in structured debates judged by AI personalities. Climb the ELO leaderboard and prove your argumentation skills.',
    siteName: 'Argu Fight',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Argu Fight - AI-Judged Debate Platform',
    description: 'Engage in structured debates judged by AI personalities',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Google Analytics Tracking ID (from environment variable or use default)
  const gaTrackingId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || 'G-HC5T282D74'
  
  // Get Google Search Console verification from database
  let gscVerification = process.env.GOOGLE_SEARCH_CONSOLE_VERIFICATION || ''
  try {
    const gscSetting = await prisma.adminSetting.findUnique({
      where: { key: 'seo_googleSearchConsoleVerification' },
    })
    if (gscSetting?.value) {
      gscVerification = gscSetting.value
    }
  } catch (error) {
    // Fallback to env variable if database query fails
    // This is expected if database is not available - don't crash the app
    console.log('[Layout] Could not fetch GSC verification from database, using env variable')
  }

  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* RSS Feed Autodiscovery */}
        <link rel="alternate" type="application/rss+xml" title="ArguFight RSS Feed" href="/feed.xml" />

        {/* Google Search Console Verification */}
        {gscVerification && (
          <meta name="google-site-verification" content={gscVerification} />
        )}
        
        {/* Google Analytics Tracking Code */}
        {gaTrackingId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaTrackingId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaTrackingId}');
              `}
            </Script>
          </>
        )}

        {/* Organization Schema for SEO */}
        <OrganizationSchema
          name="ArguFight"
          url="https://www.argufight.com"
          logo="https://www.argufight.com/logo.png"
          description="The world's first debate platform with AI judges. Engage in structured debates, get judged by AI personalities, and climb the ELO leaderboard."
          sameAs={[
            'https://twitter.com/argufight',
            'https://github.com/argufight',
          ]}
          contactPoint={{
            email: 'support@argufight.com',
            contactType: 'customer service',
          }}
        />

        {/* Website Search Schema for search box in Google results */}
        <WebsiteSearchSchema
          url="https://www.argufight.com"
          searchUrl="https://www.argufight.com/search"
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <ChallengeProvider>
            <ErrorBoundary>
              <ToastProvider>
                {children}
                <ChallengeModal />
                <NotificationTicker />
                <PushNotificationManager />
              </ToastProvider>
            </ErrorBoundary>
          </ChallengeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
