import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/db/prisma'
import { put } from '@vercel/blob'

// GET /api/admin/advertisements - Get all advertisements
export async function GET(request: NextRequest) {
  try {
    await verifyAdmin()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    const where: any = {}
    if (status) where.status = status
    if (type) where.type = type

    const ads = await prisma.advertisement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ ads })
  } catch (error: any) {
    console.error('Failed to fetch advertisements:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch advertisements' },
      { status: error.status || 500 }
    )
  }
}

// POST /api/admin/advertisements - Create a new advertisement
export async function POST(request: NextRequest) {
  try {
    await verifyAdmin()

    const formData = await request.formData()
    const title = formData.get('title') as string
    const type = formData.get('type') as string
    const targetUrl = formData.get('targetUrl') as string
    const status = formData.get('status') as string || 'DRAFT'
    const startDate = formData.get('startDate') as string
    const endDate = formData.get('endDate') as string
    const category = formData.get('category') as string
    const file = formData.get('file') as File | null

    if (!title || !type || !targetUrl) {
      return NextResponse.json(
        { error: 'title, type, and targetUrl are required' },
        { status: 400 }
      )
    }

    if (!['BANNER', 'SPONSORED_DEBATE', 'IN_FEED'].includes(type)) {
      return NextResponse.json(
        { error: 'type must be BANNER, SPONSORED_DEBATE, or IN_FEED' },
        { status: 400 }
      )
    }

    let creativeUrl = ''

    if (file) {
      // Upload to Vercel Blob Storage
      const blob = await put(`advertisements/${Date.now()}-${file.name}`, file, {
        access: 'public',
      })
      creativeUrl = blob.url
    } else {
      // Allow URL input for existing images
      const urlInput = formData.get('creativeUrl') as string
      if (urlInput) {
        creativeUrl = urlInput
      } else {
        return NextResponse.json(
          { error: 'Either file upload or creativeUrl is required' },
          { status: 400 }
        )
      }
    }

    const ad = await prisma.advertisement.create({
      data: {
        title: title.trim(),
        type,
        creativeUrl,
        targetUrl: targetUrl.trim(),
        status,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        category: category?.trim() || null,
      },
    })

    return NextResponse.json({ ad })
  } catch (error: any) {
    console.error('Failed to create advertisement:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create advertisement' },
      { status: error.status || 500 }
    )
  }
}

