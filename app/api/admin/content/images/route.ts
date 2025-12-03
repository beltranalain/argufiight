import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { getUserIdFromSession } from '@/lib/auth/session-utils'

const IMAGE_DIR = join(process.cwd(), 'public', 'uploads', 'homepage')
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// POST /api/admin/content/images - Upload image for section
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
    const fileEntry = formData.get('image')
    const file = fileEntry instanceof File ? fileEntry : null
    const sectionId = (formData.get('sectionId') as string | null) || ''

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
      await mkdir(IMAGE_DIR, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const crypto = require('crypto')
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const filename = `${crypto.randomBytes(16).toString('hex')}.${fileExtension}`
    const filepath = join(IMAGE_DIR, filename)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    const imageUrl = `/uploads/homepage/${filename}`

    // Get image dimensions (simplified - you might want to use sharp or similar)
    // For now, we'll just save the URL

    // Save to media library
    const media = await prisma.mediaLibrary.create({
      data: {
        url: imageUrl,
        filename: file.name,
        fileSize: file.size,
        mimeType: file.type,
        usedIn: `homepage:${sectionId}`,
        uploadedBy: userId,
      },
    })

    // Add to section
    const section = await prisma.homepageSection.findUnique({
      where: { id: sectionId },
      include: { images: true },
    })

    const maxOrder = section?.images.length || 0

    const image = await prisma.homepageImage.create({
      data: {
        sectionId,
        url: imageUrl,
        order: maxOrder,
      },
    })

    return NextResponse.json({ image, media })
  } catch (error) {
    console.error('Failed to upload image:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}

