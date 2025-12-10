import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/db/prisma'
import { SocialMediaIcon } from '@/components/ui/SocialMediaIcon'

const PLATFORM_LABELS: Record<string, string> = {
  FACEBOOK: 'Facebook',
  TWITTER: 'X',
  INSTAGRAM: 'Instagram',
  LINKEDIN: 'LinkedIn',
  YOUTUBE: 'YouTube',
  TIKTOK: 'TikTok',
}

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

  // Fetch social media links and footer content
  const [socialLinks, footerSection] = await Promise.all([
    prisma.socialMediaLink.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    }),
    prisma.homepageSection.findFirst({
      where: { key: 'footer', isVisible: true },
    }),
  ])

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-indigo-950 relative overflow-hidden">
      {/* Consistent starry background */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.4) 1px, transparent 0)`,
          backgroundSize: '50px 50px',
        }} />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-purple-950/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-electric-blue">
                ARGU FIGHT
              </Link>
              <Link
                href="/blog"
                className="ml-8 px-4 py-2 text-text-primary hover:text-electric-blue transition-colors hidden md:block"
              >
                Blog
              </Link>
              <Link
                href="/leaderboard"
                className="px-4 py-2 text-text-primary hover:text-electric-blue transition-colors hidden md:block"
              >
                Leaderboard
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="px-4 py-2 text-text-primary hover:text-electric-blue transition-colors"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="px-6 py-2 bg-electric-blue text-black rounded-lg font-semibold hover:bg-[#00B8E6] transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
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
                    <div className="relative w-full h-64 flex items-center justify-center bg-bg-tertiary">
                      {post.featuredImage.url.startsWith('data:') || post.featuredImage.url.includes('blob.vercel-storage.com') ? (
                        <img
                          src={post.featuredImage.url}
                          alt={post.featuredImage.alt || post.title}
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <div className="relative w-full h-full">
                          <Image
                            src={post.featuredImage.url}
                            alt={post.featuredImage.alt || post.title}
                            fill
                            className="object-contain group-hover:scale-105 transition-transform"
                          />
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-6">
                    {post.categories.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.categories.map((c) => (
                          <span
                            key={c.category.id}
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
                    <div className="flex items-center justify-end text-sm text-text-secondary">
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
              <div className="flex flex-col items-center gap-4">
                <div className="text-text-secondary text-sm">
                  Page {page} of {totalPages} ({total} {total === 1 ? 'post' : 'posts'})
                </div>
                <div className="flex justify-center gap-2 flex-wrap">
                  {page > 1 && (
                    <Link
                      href={`/blog?page=${page - 1}${params.category ? `&category=${params.category}` : ''}${params.tag ? `&tag=${params.tag}` : ''}${params.search ? `&search=${encodeURIComponent(params.search)}` : ''}`}
                      className="px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-white hover:border-electric-blue transition-colors"
                    >
                      Previous
                    </Link>
                  )}
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 10) {
                      pageNum = i + 1
                    } else if (page <= 5) {
                      pageNum = i + 1
                    } else if (page >= totalPages - 4) {
                      pageNum = totalPages - 9 + i
                    } else {
                      pageNum = page - 5 + i
                    }
                    
                    return (
                      <Link
                        key={pageNum}
                        href={`/blog?page=${pageNum}${params.category ? `&category=${params.category}` : ''}${params.tag ? `&tag=${params.tag}` : ''}${params.search ? `&search=${encodeURIComponent(params.search)}` : ''}`}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          pageNum === page
                            ? 'bg-electric-blue text-black font-semibold'
                            : 'bg-bg-secondary border border-bg-tertiary text-white hover:border-electric-blue'
                        }`}
                      >
                        {pageNum}
                      </Link>
                    )
                  })}
                  
                  {page < totalPages && (
                    <Link
                      href={`/blog?page=${page + 1}${params.category ? `&category=${params.category}` : ''}${params.tag ? `&tag=${params.tag}` : ''}${params.search ? `&search=${encodeURIComponent(params.search)}` : ''}`}
                      className="px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-white hover:border-electric-blue transition-colors"
                    >
                      Next
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="py-20 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <h3 className="text-text-primary font-semibold text-lg mb-6">Platform</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/" className="text-text-primary/80 hover:text-text-primary transition-colors text-base">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/leaderboard" className="text-text-primary/80 hover:text-text-primary transition-colors text-base">
                    Leaderboard
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-text-primary/80 hover:text-text-primary transition-colors text-base">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/advertise" className="text-text-primary/80 hover:text-text-primary transition-colors text-base">
                    Advertiser
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-text-primary font-semibold text-lg mb-6">Debate Topics</h3>
              <ul className="space-y-3">
                <li><Link href="/blog?category=politics" className="text-text-primary/80 hover:text-text-primary transition-colors text-base">Politics</Link></li>
                <li><Link href="/blog?category=science" className="text-text-primary/80 hover:text-text-primary transition-colors text-base">Science</Link></li>
                <li><Link href="/blog?category=tech" className="text-text-primary/80 hover:text-text-primary transition-colors text-base">Technology</Link></li>
                <li><Link href="/blog?category=sports" className="text-text-primary/80 hover:text-text-primary transition-colors text-base">Sports</Link></li>
                <li><Link href="/blog?category=entertainment" className="text-text-primary/80 hover:text-text-primary transition-colors text-base">Entertainment</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-text-primary font-semibold text-lg mb-6">Legal</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/terms" className="text-text-primary/80 hover:text-text-primary transition-colors text-base">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-text-primary/80 hover:text-text-primary transition-colors text-base">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-text-primary font-semibold text-lg mb-6">Contact</h3>
              <p className="text-text-primary/80 text-base mb-4">
                {footerSection?.contactEmail || 'info@argufight.com'}
              </p>

              {/* Social Media Links */}
              {socialLinks.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {socialLinks.map((link) => (
                    <a
                      key={link.platform}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-text-primary/80 hover:text-text-primary"
                      title={PLATFORM_LABELS[link.platform] || link.platform}
                    >
                      <SocialMediaIcon platform={link.platform} className="w-5 h-5" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center text-text-primary/60 text-sm pt-8 border-t border-text-primary/10">
            <p>
              &copy; {new Date().getFullYear()} {footerSection?.content || 'Argu Fight. All rights reserved.'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

