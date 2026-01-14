import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { verifySessionWithDb } from '@/lib/auth/session-verify'
import { PublicHomepageServer } from '@/components/homepage/PublicHomepageServer'
import { DashboardHomePage } from '@/components/dashboard/DashboardHomePage'
import { prisma } from '@/lib/db/prisma'

// Generate dynamic metadata for SEO
export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.argufight.com'
  
  // Get hero section for default metadata (with error handling)
  let heroSection = null
  try {
    heroSection = await prisma.homepageSection.findUnique({
      where: { key: 'hero' },
      select: { metaTitle: true, metaDescription: true },
    })
  } catch (error) {
    console.error('[generateMetadata] Failed to fetch hero section:', error)
    // Continue with defaults
  }

  const title = heroSection?.metaTitle || 'Argufight | AI-Judged Debate Platform - Win Debates with 7 AI Judges'
  const description = heroSection?.metaDescription || 'Join Argufight, the premier AI-judged debate platform. Debate any topic with 7 unique AI judges, climb the ELO leaderboard, and compete in tournaments. Free to start!'

  return {
    title,
    description,
    keywords: 'debate platform, AI judges, online debates, ELO ranking, debate tournaments, argumentation, critical thinking',
    openGraph: {
      title,
      description,
      url: baseUrl,
      siteName: 'Argufight',
      images: [
        {
          url: `${baseUrl}/og-image.svg`,
          width: 1200,
          height: 630,
          alt: 'Argufight - AI-Judged Debate Platform',
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/twitter-card.svg`],
    },
    alternates: {
      canonical: baseUrl,
    },
  }
}

export default async function RootPage() {
  try {
    // Use verifySessionWithDb to get full session with userId
    const session = await verifySessionWithDb().catch((error) => {
      console.error('[RootPage] Session verification failed:', error)
      return null // Continue without session
    })

    // Debug logging (remove in production if needed)
    if (process.env.NODE_ENV === 'development') {
      console.log('[RootPage] Session check:', {
        hasSession: !!session,
        userId: session?.userId,
      })
    }

    // If logged in, check if user is advertiser and redirect accordingly
    if (session?.userId) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: session.userId },
          select: { email: true },
        })

        if (user) {
          const advertiser = await prisma.advertiser.findUnique({
            where: { contactEmail: user.email },
            select: { status: true },
          })

          // If user is an advertiser (any status), redirect to advertiser dashboard
          // The advertiser dashboard will show appropriate message based on status
          if (advertiser) {
            redirect('/advertiser/dashboard')
          }
        }
      } catch (error) {
        console.error('[RootPage] Failed to check advertiser status:', error)
        // Continue to dashboard even if check fails
      }

      return <DashboardHomePage />
    }

    // If not logged in, fetch homepage content SERVER-SIDE and show public homepage
    // Note: Caching removed from server component - use React cache() or implement at API level
    let sections: any[] = []
    try {
      sections = await prisma.homepageSection.findMany({
        where: { isVisible: true },
        include: {
          images: {
            orderBy: { order: 'asc' },
          },
          buttons: {
            where: { isVisible: true },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      })
    } catch (error) {
      console.error('[RootPage] Failed to fetch homepage sections:', error)
      // Continue with empty sections - component will handle it
      sections = []
    }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.argufight.com'
  
  // WebApplication schema for homepage
  const webApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Argu Fight",
    "description": "AI-powered debate platform with ELO rankings and tournaments",
    "url": baseUrl,
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "1250"
    },
    "featureList": [
      "AI-judged debates",
      "ELO ranking system",
      "Tournament competitions",
      "7 unique AI judge personalities",
      "Public and private debates",
      "Real-time argumentation"
    ]
  }

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationSchema) }}
        />
        <PublicHomepageServer sections={sections} />
      </>
    )
  } catch (error: any) {
    console.error('[RootPage] Critical error:', error)
    // Return a basic error page instead of crashing
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Something went wrong</h1>
          <p className="text-text-secondary mb-8">
            We're experiencing technical difficulties. Please try again in a moment.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-electric-blue text-white rounded-lg hover:bg-electric-blue/80 transition"
          >
            Refresh Page
          </a>
        </div>
      </div>
    )
  }
}
