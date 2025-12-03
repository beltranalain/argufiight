import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { getUserIdFromSession } from '@/lib/auth/session-utils'

const MEDIA_DIR = join(process.cwd(), 'public', 'uploads', 'media')
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// GET /api/admin/content/media - Get media library
export async function GET() {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { isAdmin: true },
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const media = await prisma.mediaLibrary.findMany({
      orderBy: {
        uploadedAt: 'desc',
      },
    })

    return NextResponse.json({ media })
  } catch (error) {
    console.error('Failed to fetch media library:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media library' },
      { status: 500 }
    )
  }
}

// POST /api/admin/content/media - Upload to media library
export async function POST(request: NextRequest) {
  try {
    const session = await verifySession()
    const userId = getUserIdFromSession(session)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData() as any
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 })
    }

    // Create uploads directory
    try {
      await mkdir(MEDIA_DIR, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const crypto = require('crypto')
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const filename = `${crypto.randomBytes(16).toString('hex')}.${fileExtension}`
    const filepath = join(MEDIA_DIR, filename)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    const imageUrl = `/uploads/media/${filename}`

    // Save to media library
    const media = await prisma.mediaLibrary.create({
      data: {
        url: imageUrl,
        filename: file.name,
        fileSize: file.size,
        mimeType: file.type,
        uploadedBy: userId,
      },
    })

    return NextResponse.json({ media })
  } catch (error) {
    console.error('Failed to upload media:', error)
    return NextResponse.json(
      { error: 'Failed to upload media' },
      { status: 500 }
    )
  }
}

