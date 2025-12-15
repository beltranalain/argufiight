import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>
}): Promise<Metadata> {
  const params = await searchParams
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.argufight.com'
  const category = params.category
  
  let title = 'Browse Debates - Argu Fight Public Debate Archive'
  let description = 'Explore thousands of public debates on topics from politics to philosophy. Read arguments, see AI judge verdicts, and join the conversation.'
  
  if (category) {
    const categoryData = await prisma.category.findUnique({
      where: { name: category },
    })
    if (categoryData) {
      title = `${categoryData.label} Debates - Argu Fight`
      description = `Browse ${categoryData.label.toLowerCase()} debates on Argu Fight. Read arguments, see AI judge verdicts, and join the conversation.`
    }
  }
  
  return {
    title,
    description,
    keywords: category 
      ? `${category.toLowerCase()} debates, debate archive, argument analysis`
      : 'debate archive, public debates, political debates, philosophy debates, argument analysis',
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${baseUrl}/debates${category ? `?category=${category}` : ''}`,
    },
    alternates: {
      canonical: `${baseUrl}/debates${category ? `?category=${category}` : ''}`,
    },
  }
}

export default async function DebatesArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string; search?: string }>
}) {
  const params = await searchParams
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.argufight.com'
  const category = params.category
  const page = parseInt(params.page || '1')
  const search = params.search
  const limit = 20
  const skip = (page - 1) * limit

  // Build where clause
  const where: any = {
    visibility: 'PUBLIC',
    status: { in: ['COMPLETED', 'VERDICT_READY'] },
  }

  if (category) {
    where.category = category
  }

  if (search) {
    where.OR = [
      { topic: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  // Get debates
  const [debates, total] = await Promise.all([
    prisma.debate.findMany({
      where,
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
        _count: {
          select: {
            statements: true,
            verdicts: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: limit,
      skip,
    }),
    prisma.debate.count({ where }),
  ])

  // Get categories for filter with debate counts
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })

  // Calculate debate counts for each category
  const categoriesWithCounts = await Promise.all(
    categories.map(async (category) => {
      const count = await prisma.debate.count({
        where: {
          category: category.name as any,
          visibility: 'PUBLIC',
          status: { in: ['COMPLETED', 'VERDICT_READY'] },
        },
      })
      return {
        ...category,
        debateCount: count,
      }
    })
  )

  const totalPages = Math.ceil(total / limit)

  // CollectionPage schema for SEO
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": category 
      ? `${categoriesWithCounts.find(c => c.name === category)?.label || category} Debates`
      : "Public Debate Archive",
    "description": "Browse public debates on Argu Fight",
    "url": `${baseUrl}/debates${category ? `?category=${category}` : ''}`,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": total,
      "itemListElement": debates.slice(0, 10).map((debate, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Article",
          "headline": debate.topic,
          "url": `${baseUrl}/debates/${debate.id}`,
          "datePublished": debate.createdAt.toISOString(),
          "dateModified": debate.updatedAt.toISOString(),
        }
      }))
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="pt-20 px-4 md:px-8 pb-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Schema markup */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
          />

          <div className="mb-6">
            <h1 className="text-4xl font-bold text-text-primary mb-2">
              {category 
                ? `${categories.find(c => c.name === category)?.label || category} Debates`
                : 'Public Debate Archive'}
            </h1>
            <p className="text-lg text-text-secondary">
              {category
                ? `Browse ${total} public ${categories.find(c => c.name === category)?.label?.toLowerCase() || category.toLowerCase()} debates`
                : `Explore ${total} public debates on topics from politics to philosophy`}
            </p>
          </div>

          {/* Filters */}
          <Card>
            <CardBody>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                  <form method="GET" action="/debates" className="flex gap-2">
                    <input
                      type="search"
                      name="search"
                      placeholder="Search debates..."
                      defaultValue={search}
                      className="flex-1 px-4 py-2 bg-bg-tertiary border border-bg-secondary rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue"
                    />
                    {category && (
                      <input type="hidden" name="category" value={category} />
                    )}
                    <button
                      type="submit"
                      className="px-6 py-2 bg-electric-blue text-black font-semibold rounded-lg hover:bg-electric-blue/90 transition-colors"
                    >
                      Search
                    </button>
                  </form>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/debates"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      !category
                        ? 'bg-electric-blue text-black'
                        : 'bg-bg-secondary text-text-primary hover:bg-bg-tertiary'
                    }`}
                  >
                    All ({total})
                  </Link>
                  {categoriesWithCounts.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/debates?category=${cat.name}`}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        category === cat.name
                          ? 'bg-electric-blue text-black'
                          : 'bg-bg-secondary text-text-primary hover:bg-bg-tertiary'
                      }`}
                    >
                      {cat.label} ({cat.debateCount})
                    </Link>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Debates List */}
          {debates.length === 0 ? (
            <Card>
              <CardBody>
                <div className="text-center py-12">
                  <p className="text-text-secondary text-lg mb-4">
                    {search
                      ? `No debates found matching "${search}"`
                      : category
                      ? `No ${categoriesWithCounts.find(c => c.name === category)?.label?.toLowerCase() || category.toLowerCase()} debates yet`
                      : 'No public debates available yet'}
                  </p>
                  <Link
                    href="/"
                    className="text-electric-blue hover:underline"
                  >
                    Return to homepage
                  </Link>
                </div>
              </CardBody>
            </Card>
          ) : (
            <>
              <div className="space-y-4">
                {debates.map((debate) => (
                  <Link
                    key={debate.id}
                    href={`/debates/${debate.id}`}
                    className="block"
                  >
                    <Card className="hover:border-electric-blue transition-colors">
                      <CardBody>
                        <div className="flex items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-xl font-bold text-text-primary truncate">
                                {debate.topic}
                              </h3>
                              <Badge variant="default" className="bg-bg-secondary text-text-primary">
                                {debate.category}
                              </Badge>
                            </div>
                            {debate.description && (
                              <p className="text-text-secondary text-sm mb-3 line-clamp-2">
                                {debate.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-text-secondary">
                              <div className="flex items-center gap-2">
                                <Avatar
                                  src={debate.challenger.avatarUrl}
                                  username={debate.challenger.username}
                                  size="sm"
                                />
                                <span>{debate.challenger.username}</span>
                                {debate.winnerId && debate.winnerId === debate.challenger.id && (
                                  <Badge variant="default" className="bg-cyber-green text-black text-xs">
                                    Winner
                                  </Badge>
                                )}
                              </div>
                              <span>VS</span>
                              {debate.opponent ? (
                                <div className="flex items-center gap-2">
                                  <Avatar
                                    src={debate.opponent.avatarUrl}
                                    username={debate.opponent.username}
                                    size="sm"
                                  />
                                  <span>{debate.opponent.username}</span>
                                  {debate.winnerId && debate.winnerId === debate.opponent.id && (
                                    <Badge variant="default" className="bg-cyber-green text-black text-xs">
                                      Winner
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-text-muted">Waiting for opponent</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right text-sm text-text-secondary">
                            <div>{debate._count.statements} statements</div>
                            <div>{debate._count.verdicts} verdicts</div>
                            <div className="text-xs mt-1">
                              {new Date(debate.updatedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6">
                  {page > 1 && (
                    <Link
                      href={`/debates?${new URLSearchParams({
                        ...(category && { category }),
                        ...(search && { search }),
                        page: String(page - 1),
                      }).toString()}`}
                      className="px-4 py-2 bg-bg-secondary rounded-lg hover:bg-bg-tertiary transition-colors"
                    >
                      Previous
                    </Link>
                  )}
                  <span className="px-4 py-2 text-text-secondary">
                    Page {page} of {totalPages}
                  </span>
                  {page < totalPages && (
                    <Link
                      href={`/debates?${new URLSearchParams({
                        ...(category && { category }),
                        ...(search && { search }),
                        page: String(page + 1),
                      }).toString()}`}
                      className="px-4 py-2 bg-bg-secondary rounded-lg hover:bg-bg-tertiary transition-colors"
                    >
                      Next
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
