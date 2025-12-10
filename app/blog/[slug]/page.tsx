import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params

  const post = await prisma.blogPost.findUnique({
    where: { slug },
    select: {
      title: true,
      metaTitle: true,
      metaDescription: true,
      excerpt: true,
      ogImage: true,
      featuredImage: {
        select: {
          url: true,
        },
      },
    },
  })

  if (!post || post.metaTitle === null) {
    return {
      title: 'Blog Post Not Found',
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.argufight.com'
  const title = post.metaTitle || post.title
  const description = post.metaDescription || post.excerpt || 'Read this article on Argufight'
  const ogImage = post.ogImage || post.featuredImage?.url || `${baseUrl}/og-image.png`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: `${baseUrl}/blog/${slug}`,
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          bio: true,
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
  })

  if (!post) {
    notFound()
  }

  // Only show published posts
  if (post.status !== 'PUBLISHED') {
    notFound()
  }

  // Check if published date is in the future
  if (post.publishedAt && post.publishedAt > new Date()) {
    notFound()
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.argufight.com'

  // Structured data for Article
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.metaDescription || post.excerpt || post.title,
    "image": post.ogImage || post.featuredImage?.url || `${baseUrl}/og-image.png`,
    "datePublished": post.publishedAt || post.createdAt,
    "dateModified": post.updatedAt,
    "author": {
      "@type": "Person",
      "name": post.author.username,
    },
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
      "@id": `${baseUrl}/blog/${slug}`,
    },
  }

  // Calculate reading time (average 200 words per minute)
  const wordCount = post.content.split(/\s+/).length
  const readingTime = Math.ceil(wordCount / 200)

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
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

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

        <article className="pt-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Breadcrumb */}
          <nav className="mb-8 text-sm text-text-secondary">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/blog" className="hover:text-white transition-colors">
              Blog
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white">{post.title}</span>
          </nav>

          {/* Header */}
          <header className="mb-8">
            {post.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.categories.map((c) => (
                  <Link
                    key={c.category.id}
                    href={`/blog?category=${c.category.slug}`}
                    className="px-3 py-1 text-sm bg-electric-blue/20 text-electric-blue rounded hover:bg-electric-blue/30 transition-colors"
                  >
                    {c.category.name}
                  </Link>
                ))}
              </div>
            )}

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-xl text-text-primary/80 mb-6">{post.excerpt}</p>
            )}

            <div className="flex items-center gap-4 text-text-secondary">
              {post.publishedAt && (
                <span>
                  {new Date(post.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              )}
              <span className="text-text-secondary">•</span>
              <span>{readingTime} min read</span>
              <span className="text-text-secondary">•</span>
              <span>{post.views} views</span>
            </div>
          </header>

          {/* Featured Image */}
          {post.featuredImage && (
            <div className="relative w-full mb-8 rounded-xl overflow-hidden bg-bg-tertiary flex items-center justify-center min-h-[400px]">
              {post.featuredImage.url.startsWith('data:') || post.featuredImage.url.includes('blob.vercel-storage.com') ? (
                <img
                  src={post.featuredImage.url}
                  alt={post.featuredImage.alt || post.title}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="relative w-full h-full min-h-[400px]">
                  <Image
                    src={post.featuredImage.url}
                    alt={post.featuredImage.alt || post.title}
                    fill
                    className="object-contain"
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 896px"
                  />
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div
            className="prose prose-invert prose-lg max-w-none prose-headings:text-white prose-p:text-text-primary/90 prose-a:text-electric-blue prose-a:no-underline hover:prose-a:underline prose-strong:text-white prose-ul:text-text-primary/90 prose-li:text-text-primary/90 prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mt-8 pt-8 border-t border-bg-tertiary">
              <h3 className="text-lg font-semibold text-white mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((t) => (
                  <Link
                    key={t.tag.id}
                    href={`/blog?tag=${t.tag.slug}`}
                    className="px-3 py-1 text-sm bg-bg-tertiary text-text-secondary rounded hover:bg-electric-blue/20 hover:text-electric-blue transition-colors"
                  >
                    #{t.tag.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Back to Blog */}
          <div className="mt-12 pt-8 border-t border-bg-tertiary">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-electric-blue hover:text-[#00B8E6] transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Blog
            </Link>
          </div>
        </article>

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
    </>
  )
}

