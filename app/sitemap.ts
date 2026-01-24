import { MetadataRoute } from 'next'
import { prisma } from '@/lib/db/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.argufight.com'
  
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/leaderboard`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/how-it-works`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/topics`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/debates`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    // Landing pages
    {
      url: `${baseUrl}/online-debate-platform`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/debate-practice`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/ai-debate`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/debate-simulator`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/argument-checker`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]

  // Get public debates (no limit - include all public debates for SEO)
  let publicDebates: MetadataRoute.Sitemap = []
  try {
    publicDebates = await prisma.debate.findMany({
      where: {
        visibility: 'PUBLIC',
        status: {
          in: ['COMPLETED', 'ACTIVE'], // Include both completed and active debates
        },
      },
      select: {
        id: true,
        slug: true,
        updatedAt: true,
        status: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      // No take limit - include all public debates
    }).then(debates => debates.map(debate => ({
      url: `${baseUrl}/debates/${debate.slug || debate.id}`,
      lastModified: debate.updatedAt,
      changeFrequency: debate.status === 'ACTIVE' ? ('daily' as const) : ('weekly' as const),
      priority: debate.status === 'ACTIVE' ? 0.8 : 0.7,
    })))
  } catch (error) {
    console.log('[Sitemap] Error fetching public debates:', error)
  }

  // Get published blog posts (all of them, no limit)
  let blogPosts: MetadataRoute.Sitemap = []
  let blogPaginationPages: MetadataRoute.Sitemap = []
  try {
    // First, get total count to calculate pagination
    const totalPosts = await prisma.blogPost.count({
      where: {
        status: 'PUBLISHED',
        OR: [
          { publishedAt: { lte: new Date() } },
          { publishedAt: null },
        ],
      },
    })

    // Get all published blog posts (no limit)
    blogPosts = await prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { publishedAt: { lte: new Date() } },
          { publishedAt: null },
        ],
      },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
    }).then(posts => posts.map(post => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })))

    // Add pagination pages for blog listing (10 posts per page)
    const postsPerPage = 10
    const totalPages = Math.ceil(totalPosts / postsPerPage)
    if (totalPages > 1) {
      blogPaginationPages = Array.from({ length: totalPages }, (_, i) => ({
        url: `${baseUrl}/blog${i === 0 ? '' : `?page=${i + 1}`}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: i === 0 ? 0.9 : 0.7,
      }))
    }
  } catch (error) {
    console.log('[Sitemap] Error fetching blog posts:', error)
  }

  // Get public user profiles (users with at least one completed debate)
  let userProfiles: MetadataRoute.Sitemap = []
  try {
    userProfiles = await prisma.user.findMany({
      where: {
        isAI: false, // Exclude AI bots
        OR: [
          { challengerDebates: { some: { status: 'COMPLETED', visibility: 'PUBLIC' } } },
          { opponentDebates: { some: { status: 'COMPLETED', visibility: 'PUBLIC' } } },
        ],
      },
      select: {
        username: true,
        updatedAt: true,
      },
      take: 1000, // Limit to top 1000 most active users
      orderBy: {
        eloRating: 'desc',
      },
    }).then(users => users.map(user => ({
      url: `${baseUrl}/profile/${user.username}`,
      lastModified: user.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })))
  } catch (error) {
    console.log('[Sitemap] Error fetching user profiles:', error)
  }

  // Get public tournaments
  let tournaments: MetadataRoute.Sitemap = []
  try {
    tournaments = await prisma.tournament.findMany({
      where: {
        isPrivate: false,
        status: {
          in: ['REGISTRATION_OPEN', 'IN_PROGRESS', 'COMPLETED'],
        },
      },
      select: {
        id: true,
        updatedAt: true,
        status: true,
      },
      orderBy: {
        startDate: 'desc',
      },
    }).then(tourneys => tourneys.map(tournament => ({
      url: `${baseUrl}/tournaments/${tournament.id}`,
      lastModified: tournament.updatedAt,
      changeFrequency: tournament.status === 'IN_PROGRESS' ? ('daily' as const) : ('weekly' as const),
      priority: tournament.status === 'IN_PROGRESS' ? 0.8 : 0.6,
    })))
  } catch (error) {
    console.log('[Sitemap] Error fetching tournaments:', error)
  }

  // Get unique blog categories
  let blogCategories: MetadataRoute.Sitemap = []
  try {
    const categories = await prisma.blogPostCategory.findMany({
      select: {
        slug: true,
        updatedAt: true,
      },
    })

    blogCategories = categories.map(c => ({
      url: `${baseUrl}/blog/category/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch (error) {
    console.log('[Sitemap] Error fetching blog categories:', error)
  }

  return [
    ...staticPages,
    ...publicDebates,
    ...blogPosts,
    ...blogPaginationPages,
    ...userProfiles,
    ...tournaments,
    ...blogCategories,
  ]
}



