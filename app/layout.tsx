import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ThemeProvider } from '@/lib/contexts/ThemeContext'

export const metadata: Metadata = {
  title: 'Honorable AI - AI-Judged Debate Platform',
  description: 'The world\'s first debate platform with AI judges. Engage in structured debates, get judged by AI personalities, and climb the ELO leaderboard.',
  keywords: 'debate, AI, artificial intelligence, ELO, competition, argumentation, judges',
  authors: [{ name: 'Honorable AI' }],
  creator: 'Honorable AI',
  publisher: 'Honorable AI',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://honorable-ai.vercel.app',
    title: 'Honorable AI - AI-Judged Debate Platform',
    description: 'Engage in structured debates judged by AI personalities. Climb the ELO leaderboard and prove your argumentation skills.',
    siteName: 'Honorable AI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Honorable AI - AI-Judged Debate Platform',
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
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body suppressHydrationWarning>
        <ThemeProvider>
          <ErrorBoundary>
            <ToastProvider>
              {children}
            </ToastProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}
