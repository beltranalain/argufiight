import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import Image from 'next/image'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'
import { RelatedDebates } from '@/components/debate/RelatedDebates'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params

  const debate = await prisma.debate.findUnique({
    where: { id },
    select: {
      id: true,
      topic: true,
      description: true,
      category: true,
      challenger: {
        select: {
          username: true,
          avatarUrl: true,
        },
      },
      opponent: {
        select: {
          username: true,
          avatarUrl: true,
        },
      },
      status: true,
      visibility: true,
      createdAt: true,
    },
  })

  if (!debate || debate.visibility !== 'PUBLIC') {
    return {
      title: 'Debate Not Found',
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.argufight.com'
  const title = `${debate.topic} | Argufight Debate`
  const description = debate.description || `Watch ${debate.challenger.username} debate ${debate.opponent?.username || 'an opponent'} on ${debate.topic}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${baseUrl}/debates/${id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `${baseUrl}/debates/${id}`,
    },
  }
}

export default async function PublicDebatePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Check if this is a UUID (old format) and redirect to slug if available
  const debateCheck = await prisma.debate.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      visibility: true,
    },
  })

  // If debate has a slug, redirect to slug-based URL (301 permanent redirect)
  if (debateCheck?.slug) {
    permanentRedirect(`/debates/${debateCheck.slug}`)
  }

  // If no slug but debate exists, fetch full data (fallback for debates without slugs yet)
  const debate = await prisma.debate.findUnique({
    where: { id },
    include: {
      challenger: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          eloRating: true,
        },
      },
      opponent: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          eloRating: true,
        },
      },
      statements: {
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          round: 'asc',
        },
      },
      verdicts: {
        include: {
          judge: {
            select: {
              name: true,
              emoji: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
    },
  })

  if (!debate) {
    notFound()
  }

  // Only show public debates
  if (debate.visibility !== 'PUBLIC') {
    notFound()
  }

  // If debate has a slug but we're on the ID route, redirect
  if (debate.slug) {
    permanentRedirect(`/debates/${debate.slug}`)
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.argufight.com'

  // Structured data for Article
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": debate.topic,
    "description": debate.description || debate.topic,
    "datePublished": debate.createdAt,
    "dateModified": debate.updatedAt,
    "author": [
      {
        "@type": "Person",
        "name": debate.challenger.username,
      },
      ...(debate.opponent ? [{
        "@type": "Person",
        "name": debate.opponent.username,
      }] : []),
    ],
    "publisher": {
      "@type": "Organization",
      "name": "Argufight",
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/logo.png`,
      },
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": debate.slug ? `${baseUrl}/debates/${debate.slug}` : `${baseUrl}/debates/${id}`,
    },
  }

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-indigo-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Breadcrumb with Schema */}
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Debates', href: '/debates' },
              { label: debate.topic, href: debate.slug ? `/debates/${debate.slug}` : `/debates/${id}` },
            ]}
          />

          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 text-sm bg-electric-blue/20 text-electric-blue rounded">
                {debate.category}
              </span>
              {debate.status === 'COMPLETED' && (
                <span className="px-3 py-1 text-sm bg-cyber-green/20 text-cyber-green rounded">
                  Completed
                </span>
              )}
              {debate.status === 'ACTIVE' && (
                <span className="px-3 py-1 text-sm bg-neon-orange/20 text-neon-orange rounded">
                  Active
                </span>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {debate.topic}
            </h1>

            {debate.description && (
              <p className="text-xl text-text-primary/80 mb-6">{debate.description}</p>
            )}

            {/* Participants */}
            <div className="flex items-center gap-6 mb-6">
              <div className="flex items-center gap-3">
                {debate.challenger.avatarUrl ? (
                  <Image
                    src={debate.challenger.avatarUrl}
                    alt={debate.challenger.username}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-electric-blue/20 flex items-center justify-center">
                    <span className="text-electric-blue font-semibold">
                      {debate.challenger.username[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-white font-medium">{debate.challenger.username}</p>
                  <p className="text-text-secondary text-sm">ELO: {debate.challenger.eloRating}</p>
                </div>
              </div>

              <span className="text-text-secondary">vs</span>

              {debate.opponent ? (
                <div className="flex items-center gap-3">
                  {debate.opponent.avatarUrl ? (
                    <Image
                      src={debate.opponent.avatarUrl}
                      alt={debate.opponent.username}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-electric-blue/20 flex items-center justify-center">
                      <span className="text-electric-blue font-semibold">
                        {debate.opponent.username[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-white font-medium">{debate.opponent.username}</p>
                    <p className="text-text-secondary text-sm">ELO: {debate.opponent.eloRating}</p>
                  </div>
                </div>
              ) : (
                <div className="text-text-secondary">Waiting for opponent...</div>
              )}
            </div>

            <div className="text-text-secondary text-sm">
              Created {new Date(debate.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </header>

          {/* Statements */}
          {debate.statements.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Arguments</h2>
              <div className="space-y-6">
                {debate.statements.map((statement) => (
                  <div
                    key={statement.id}
                    className="bg-bg-secondary border border-bg-tertiary rounded-xl p-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      {statement.author.avatarUrl ? (
                        <Image
                          src={statement.author.avatarUrl}
                          alt={statement.author.username}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-electric-blue/20 flex items-center justify-center">
                          <span className="text-electric-blue text-xs font-semibold">
                            {statement.author.username[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-white font-medium text-sm">{statement.author.username}</p>
                        <p className="text-text-secondary text-xs">Round {statement.round}</p>
                      </div>
                    </div>
                    <div
                      className="prose prose-invert prose-sm max-w-none prose-p:text-text-primary/90"
                      dangerouslySetInnerHTML={{ __html: statement.content }}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Verdicts */}
          {debate.verdicts.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">AI Judge Verdicts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {debate.verdicts.map((verdict) => (
                  <div
                    key={verdict.id}
                    className="bg-bg-secondary border border-bg-tertiary rounded-xl p-6"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{verdict.judge.emoji}</span>
                      <h3 className="text-lg font-semibold text-white">{verdict.judge.name}</h3>
                    </div>
                    {verdict.winnerId && (
                      <p className="text-text-secondary text-sm mb-2">
                        Winner: {verdict.winnerId === debate.challengerId ? debate.challenger.username : debate.opponent?.username}
                      </p>
                    )}
                    {verdict.reasoning && (
                      <p className="text-text-primary/80 text-sm">{verdict.reasoning}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Related Debates */}
          <RelatedDebates
            currentDebateId={id}
            category={debate.category}
            challengerId={debate.challengerId}
            opponentId={debate.opponentId}
          />

          {/* CTA */}
          <div className="bg-bg-secondary border border-electric-blue/50 rounded-xl p-8 text-center mt-12">
            <h3 className="text-2xl font-bold text-white mb-4">Want to Join the Debate?</h3>
            <p className="text-text-secondary mb-6">
              Sign up to create your own debates and challenge others
            </p>
            <Link
              href="/signup"
              className="inline-block px-8 py-3 bg-electric-blue text-black rounded-lg font-semibold hover:bg-[#00B8E6] transition-colors"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

