import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { verifySessionWithDb } from '@/lib/auth/session-verify'
import { PublicHomepageServer } from '@/components/homepage/PublicHomepageServer'
import { DashboardHomePage } from '@/components/dashboard/DashboardHomePage'
import { prisma } from '@/lib/db/prisma'

// Deduplicate hero metadata query within a single request via React cache()
const getHeroMetadata = cache(async () => {
  try {
    return await prisma.homepageSection.findUnique({
      where: { key: 'hero' },
      select: { metaTitle: true, metaDescription: true },
    })
  } catch {
    return null
  }
})

// Cache homepage sections for 5 minutes — content changes rarely
const getCachedHomepageSections = unstable_cache(
  async () => {
    return prisma.homepageSection.findMany({
      where: { isVisible: true },
      include: {
        images: { orderBy: { order: 'asc' } },
        buttons: { where: { isVisible: true }, orderBy: { order: 'asc' } },
      },
      orderBy: { order: 'asc' },
    })
  },
  ['homepage-sections'],
  { revalidate: 300 }
)

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.argufight.com'
  const heroSection = await getHeroMetadata()

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
    const session = await verifySessionWithDb().catch(() => null)

    // If logged in, check if user is advertiser and redirect accordingly
    if (session?.userId) {
      try {
        // session.user.email is already available from verifySessionWithDb — no extra DB query needed
        const advertiser = await prisma.advertiser.findUnique({
          where: { contactEmail: session.user.email },
          select: { status: true },
        })

        if (advertiser) {
          redirect('/advertiser/dashboard')
        }
      } catch (error: any) {
        // redirect() throws a special error — rethrow it
        if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error
        // Continue to dashboard even if advertiser check fails
      }

      return <DashboardHomePage />
    }

    // Logged-out path: fetch cached homepage sections
    let sections: any[] = []
    try {
      sections = await getCachedHomepageSections()
    } catch {
      sections = []
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.argufight.com'

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
    // Rethrow Next.js redirect errors
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error

    console.error('[RootPage] Critical error:', error)
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
