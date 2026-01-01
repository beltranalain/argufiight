import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/homepage/content - Get public homepage content
export async function GET() {
  try {
    // Cache homepage sections for 10 minutes to reduce database queries
    const { cache } = await import('@/lib/utils/cache')
    const cacheKey = 'homepage:sections'
    let sections = cache.get(cacheKey)
    
    if (!sections) {
      sections = await prisma.homepageSection.findMany({
        where: {
          isVisible: true,
        },
        include: {
          images: {
            orderBy: {
              order: 'asc',
            },
          },
          buttons: {
            where: {
              isVisible: true,
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
        orderBy: {
          order: 'asc',
        },
      })
      cache.set(cacheKey, sections, 600) // Cache for 10 minutes
    }

    return NextResponse.json({ sections })
  } catch (error) {
    console.error('Failed to fetch homepage content:', error)
    // Return default sections if database query fails
    return NextResponse.json({
      sections: [
        {
          id: 'default-hero',
          key: 'hero',
          title: 'Welcome to Honorable AI',
          content: '<p>The world\'s first AI-judged debate platform. Engage in structured debates and get judged by AI personalities.</p>',
          order: 0,
          isVisible: true,
          images: [],
          buttons: [
            {
              id: 'default-signup',
              text: 'Get Started',
              url: '/signup',
              variant: 'primary',
              order: 0,
              isVisible: true,
            },
            {
              id: 'default-login',
              text: 'Login',
              url: '/login',
              variant: 'secondary',
              order: 1,
              isVisible: true,
            },
          ],
        },
      ],
    })
  }
}










