import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'

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

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-indigo-950">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
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
              <div className="flex items-center gap-2">
                {post.author.avatarUrl ? (
                  <Image
                    src={post.author.avatarUrl}
                    alt={post.author.username}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-electric-blue/20 flex items-center justify-center">
                    <span className="text-electric-blue font-semibold">
                      {post.author.username[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-white font-medium">{post.author.username}</p>
                  {post.publishedAt && (
                    <p className="text-sm">
                      {new Date(post.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-text-secondary">•</span>
              <span>{readingTime} min read</span>
              <span className="text-text-secondary">•</span>
              <span>{post.views} views</span>
            </div>
          </header>

          {/* Featured Image */}
          {post.featuredImage && (
            <div className="relative w-full h-96 mb-8 rounded-xl overflow-hidden">
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
                  className="object-cover"
                  priority
                />
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
      </div>
    </>
  )
}

