import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import { ToastProvider } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ThemeProvider } from '@/lib/contexts/ThemeContext'
import { NotificationTicker } from '@/components/notifications/NotificationTicker'

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
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://honorable-ai.vercel.app',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Google Analytics Tracking ID (from environment variable or use default)
  const gaTrackingId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || 'G-41YDQDD6J3'

  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
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
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <ErrorBoundary>
            <ToastProvider>
              {children}
              <NotificationTicker />
            </ToastProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}
