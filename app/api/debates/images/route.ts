import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// POST /api/debates/images - Upload debate image
export async function POST(request: NextRequest) {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = getUserIdFromSession(session)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData() as any
    const fileEntry = formData.get('image')
    const file = fileEntry instanceof File ? fileEntry : null
    const debateId = (formData.get('debateId') as string | null) || null
    const alt = (formData.get('alt') as string | null) || null
    const caption = (formData.get('caption') as string | null) || null
    const order = parseInt((formData.get('order') as string) || '0')

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image must be less than 10MB' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'debates')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split('.').pop() || 'jpg'
    const filename = `${timestamp}-${randomStr}.${extension}`
    const filepath = join(uploadsDir, filename)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Get image dimensions (basic check)
    // In production, you'd use a proper image library like sharp
    const url = `/uploads/debates/${filename}`

    // If debateId is provided, create the DebateImage record
    if (debateId) {
      const debateImage = await prisma.debateImage.create({
        data: {
          debateId,
          url,
          alt: alt || null,
          caption: caption || null,
          order,
          fileSize: file.size,
          mimeType: file.type,
          uploadedBy: userId,
        },
      })

      return NextResponse.json({ image: debateImage })
    }

    // Otherwise, just return the URL for later association
    return NextResponse.json({
      url,
      alt: alt || null,
      caption: caption || null,
      order,
      fileSize: file.size,
      mimeType: file.type,
    })
  } catch (error) {
    console.error('Failed to upload debate image:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}

