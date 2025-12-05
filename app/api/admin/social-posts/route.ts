import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/db/prisma'

// GET /api/admin/social-posts - Get all social media posts
export async function GET(request: NextRequest) {
  try {
    await verifyAdmin()

    const { searchParams } = new URL(request.url)
    const debateId = searchParams.get('debateId')
    const platform = searchParams.get('platform')
    const status = searchParams.get('status')

    const where: any = {}
    if (debateId) where.debateId = debateId
    if (platform) where.platform = platform
    if (status) where.status = status

    const posts = await prisma.socialMediaPost.findMany({
      where,
      include: {
        debate: {
          select: {
            id: true,
            topic: true,
            category: true,
            challenger: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
            opponent: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ posts })
  } catch (error: any) {
    console.error('Failed to fetch social posts:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch social posts' },
      { status: error.status || 500 }
    )
  }
}

// POST /api/admin/social-posts - Create a new social media post
export async function POST(request: NextRequest) {
  try {
    await verifyAdmin()

    const body = await request.json()
    const { debateId, platform, content, imagePrompt, hashtags, status, scheduledAt } = body

    if (!debateId || !platform || !content) {
      return NextResponse.json(
        { error: 'debateId, platform, and content are required' },
        { status: 400 }
      )
    }

    if (!['INSTAGRAM', 'LINKEDIN', 'TWITTER'].includes(platform)) {
      return NextResponse.json(
        { error: 'platform must be INSTAGRAM, LINKEDIN, or TWITTER' },
        { status: 400 }
      )
    }

    const post = await prisma.socialMediaPost.create({
      data: {
        debateId,
        platform,
        content: content.trim(),
        imagePrompt: imagePrompt?.trim() || null,
        hashtags: hashtags?.trim() || null,
        status: status || 'DRAFT',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      },
      include: {
        debate: {
          select: {
            id: true,
            topic: true,
            category: true,
          },
        },
      },
    })

    return NextResponse.json({ post })
  } catch (error: any) {
    console.error('Failed to create social post:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create social post' },
      { status: error.status || 500 }
    )
  }
}

