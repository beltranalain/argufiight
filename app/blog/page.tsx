import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/db/prisma'

export const metadata: Metadata = {
  title: 'Blog | Argufight',
  description: 'Read the latest articles about debate, argumentation, critical thinking, and the Argufight platform.',
  openGraph: {
    title: 'Blog | Argufight',
    description: 'Read the latest articles about debate, argumentation, and critical thinking.',
    type: 'website',
  },
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string; tag?: string; search?: string }>
}) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const limit = 10
  const skip = (page - 1) * limit

  const where: any = {
    status: 'PUBLISHED',
    OR: [
      { publishedAt: { lte: new Date() } },
      { publishedAt: null },
    ],
  }

  if (params.category) {
    where.categories = {
      some: {
        category: {
          slug: params.category,
        },
      },
    }
  }

  if (params.tag) {
    where.tags = {
      some: {
        tag: {
          slug: params.tag,
        },
      },
    }
  }

  if (params.search) {
    where.OR = [
      ...where.OR,
      { title: { contains: params.search, mode: 'insensitive' } },
      { excerpt: { contains: params.search, mode: 'insensitive' } },
    ]
  }

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        featuredImage: {
          select: {
            id: true,
            url: true,
            alt: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.blogPost.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-indigo-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Blog</h1>
          <p className="text-xl text-text-primary/80">
            Latest articles about debate, argumentation, and critical thinking
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary text-lg">No blog posts found.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="bg-bg-secondary border border-bg-tertiary rounded-xl overflow-hidden hover:border-electric-blue/50 transition-all group"
                >
                  {post.featuredImage && (
                    <div className="relative w-full h-48">
                      {post.featuredImage.url.startsWith('data:') || post.featuredImage.url.includes('blob.vercel-storage.com') ? (
                        <img
                          src={post.featuredImage.url}
                          alt={post.featuredImage.alt || post.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image
                          src={post.featuredImage.url}
                          alt={post.featuredImage.alt || post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      )}
                    </div>
                  )}
                  <div className="p-6">
                    {post.categories.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.categories.map((c) => (
                          <span
                            key={c.id}
                            className="px-2 py-1 text-xs bg-electric-blue/20 text-electric-blue rounded"
                          >
                            {c.category.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-electric-blue transition-colors">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-text-secondary text-sm mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm text-text-secondary">
                      <span>{post.author.username}</span>
                      <span>
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString()
                          : 'Recently'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                {page > 1 && (
                  <Link
                    href={`/blog?page=${page - 1}${params.category ? `&category=${params.category}` : ''}${params.tag ? `&tag=${params.tag}` : ''}`}
                    className="px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-white hover:border-electric-blue transition-colors"
                  >
                    Previous
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={`/blog?page=${page + 1}${params.category ? `&category=${params.category}` : ''}${params.tag ? `&tag=${params.tag}` : ''}`}
                    className="px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-white hover:border-electric-blue transition-colors"
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
  )
}

