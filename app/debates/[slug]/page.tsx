import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { verifySession } from '@/lib/auth/session'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import Image from 'next/image'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'
import { RelatedDebates } from '@/components/debate/RelatedDebates'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params

  // Check if this is a UUID (old format) - UUIDs are 36 characters with dashes
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)
  
  let debate = null
  if (isUUID) {
    // Try to find by ID first (old UUID format)
    debate = await prisma.debate.findUnique({
      where: { id: slug },
      select: {
        id: true,
        slug: true,
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
    
    // If debate has a slug, redirect to slug URL for metadata
    if (debate?.slug) {
      // Return metadata for slug URL (will redirect in component)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.argufight.com'
      return {
        title: `${debate.topic} | Argufight Debate`,
        description: debate.description || `Watch ${debate.challenger.username} debate ${debate.opponent?.username || 'an opponent'} on ${debate.topic}`,
        alternates: {
          canonical: `${baseUrl}/debates/${debate.slug}`,
        },
      }
    }
  } else {
    // Try to find by slug (new format)
    debate = await prisma.debate.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
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
  }

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
      url: `${baseUrl}/debates/${debate.slug || debate.id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `${baseUrl}/debates/${debate.slug || debate.id}`,
    },
  }
}

export default async function PublicDebatePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ token?: string }>
}) {
  const { slug } = await params
  const urlParams = await searchParams
  const shareToken = urlParams?.token

  // Check if this is a UUID (old format) - UUIDs are 36 characters with dashes
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)
  
  let debate = null

  if (isUUID) {
    // This is an old UUID URL - find by ID and redirect to slug if available
    const debateCheck = await prisma.debate.findUnique({
      where: { id: slug },
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
    if (debateCheck) {
      debate = await prisma.debate.findUnique({
        where: { id: slug },
        select: {
          id: true,
          slug: true,
          topic: true,
          description: true,
          category: true,
          visibility: true,
          shareToken: true,
          challengerId: true,
          opponentId: true,
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
                  id: true,
                  name: true,
                  emoji: true,
                  personality: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          status: true,
          currentRound: true,
          totalRounds: true,
          roundDeadline: true,
          createdAt: true,
          updatedAt: true,
          winnerId: true,
          verdictReached: true,
          verdictDate: true,
        },
      })
    }
  } else {
    // This is a slug URL - find by slug
    debate = await prisma.debate.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        topic: true,
        description: true,
        category: true,
        visibility: true,
        shareToken: true,
        challengerId: true,
        opponentId: true,
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
                id: true,
                name: true,
                emoji: true,
                personality: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        status: true,
        currentRound: true,
        totalRounds: true,
        roundDeadline: true,
        createdAt: true,
        updatedAt: true,
        winnerId: true,
        verdictReached: true,
        verdictDate: true,
      },
    })
  }

  if (!debate) {
    notFound()
  }

  // Check access for private debates
  if (debate.visibility !== 'PUBLIC') {
    // Get current user session to check if they're a participant
    const session = await verifySession()
    const currentUserId = session ? getUserIdFromSession(session) : null
    
    // Check if user is a participant
    const isParticipant = currentUserId && (
      debate.challengerId === currentUserId || 
      debate.opponentId === currentUserId
    )
    
    // Check for shareToken in URL (for private debates with share links)
    const hasValidToken = shareToken && debate.shareToken === shareToken
    
    // Only allow access if user is a participant or has valid share token
    if (!isParticipant && !hasValidToken) {
      notFound()
    }
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
      "@id": `${baseUrl}/debates/${debate.slug || debate.id}`,
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
              { label: debate.topic, href: `/debates/${debate.slug || debate.id}` },
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
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-3">
                <Image
                  src={debate.challenger.avatarUrl || '/default-avatar.png'}
                  alt={debate.challenger.username}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
                <div>
                  <p className="text-white font-semibold">{debate.challenger.username}</p>
                  <p className="text-text-secondary text-sm">ELO: {debate.challenger.eloRating}</p>
                </div>
              </div>
              <span className="text-text-secondary">vs</span>
              {debate.opponent ? (
                <div className="flex items-center gap-3">
                  <Image
                    src={debate.opponent.avatarUrl || '/default-avatar.png'}
                    alt={debate.opponent.username}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                  <div>
                    <p className="text-white font-semibold">{debate.opponent.username}</p>
                    <p className="text-text-secondary text-sm">ELO: {debate.opponent.eloRating}</p>
                  </div>
                </div>
              ) : (
                <p className="text-text-secondary">Waiting for opponent...</p>
              )}
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
                    <div className="flex items-center gap-3 mb-3">
                      <Image
                        src={statement.author.avatarUrl || '/default-avatar.png'}
                        alt={statement.author.username}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                      <div>
                        <p className="text-white font-semibold">{statement.author.username}</p>
                        <p className="text-text-secondary text-sm">Round {statement.round}</p>
                      </div>
                    </div>
                    <p className="text-text-primary whitespace-pre-wrap">{statement.content}</p>
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
                      <div>
                        <p className="text-white font-semibold">{verdict.judge.name}</p>
                        <p className="text-text-secondary text-sm">{verdict.judge.personality}</p>
                      </div>
                    </div>
                    <p className="text-text-primary mb-2">{verdict.reasoning}</p>
                    {verdict.challengerScore !== null && verdict.opponentScore !== null && (
                      <div className="flex gap-4 mt-4 text-sm">
                        <span className="text-electric-blue">
                          Challenger: {verdict.challengerScore}/100
                        </span>
                        <span className="text-neon-orange">
                          Opponent: {verdict.opponentScore}/100
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Winner */}
          {debate.winnerId && (
            <section className="mb-12">
              <div className="bg-gradient-to-r from-cyber-green/20 to-electric-blue/20 border border-cyber-green/50 rounded-xl p-8 text-center">
                <h2 className="text-3xl font-bold text-white mb-2">Winner</h2>
                <p className="text-2xl text-cyber-green font-semibold">
                  {debate.winnerId === debate.challengerId 
                    ? debate.challenger.username 
                    : debate.opponent?.username || 'Unknown'}
                </p>
              </div>
            </section>
          )}

          {/* Related Debates */}
          <RelatedDebates
            currentDebateId={debate.id}
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
