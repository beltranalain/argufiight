import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { verifySessionWithDb } from '@/lib/auth/session-verify'
import { PublicHomepageServer } from '@/components/homepage/PublicHomepageServer'
import { DashboardHomePage } from '@/components/dashboard/DashboardHomePage'
import { prisma } from '@/lib/db/prisma'

// Generate dynamic metadata for SEO
export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.argufight.com'
  
  // Get hero section for default metadata
  const heroSection = await prisma.homepageSection.findUnique({
    where: { key: 'hero' },
    select: { metaTitle: true, metaDescription: true },
  })

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
  // Use verifySessionWithDb to get full session with userId
  const session = await verifySessionWithDb()

  // Debug logging (remove in production if needed)
  if (process.env.NODE_ENV === 'development') {
    console.log('[RootPage] Session check:', {
      hasSession: !!session,
      userId: session?.userId,
    })
  }

  // If logged in, check if user is advertiser and redirect accordingly
  if (session?.userId) {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { email: true },
    })

    if (user) {
      const advertiser = await prisma.advertiser.findUnique({
        where: { contactEmail: user.email },
        select: { status: true },
      })

      // If user is an approved advertiser, redirect to advertiser dashboard
      if (advertiser && advertiser.status === 'APPROVED') {
        redirect('/advertiser/dashboard')
      }
    }

    return <DashboardHomePage />
  }

  // If not logged in, fetch homepage content SERVER-SIDE and show public homepage
  const sections = await prisma.homepageSection.findMany({
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
}
