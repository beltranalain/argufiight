import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomBytes } from 'crypto'

// Force Node.js runtime for file operations
export const runtime = 'nodejs'

// For now, we'll store avatars in the public/uploads/avatars directory
// In production, you'd want to use a service like Uploadthing, Cloudinary, or S3

const AVATAR_DIR = join(process.cwd(), 'public', 'uploads', 'avatars')
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// POST /api/profile/avatar - Upload profile picture
export async function POST(request: NextRequest) {
  try {
    const session = await verifySession()
    const userId = getUserIdFromSession(session)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData() as any
    const file = formData.get('avatar') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
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

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    try {
      await mkdir(AVATAR_DIR, { recursive: true })
    } catch (error) {
      // Directory might already exist, that's fine
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const crypto = require('crypto')
    const filename = `${userId}-${crypto.randomBytes(16).toString('hex')}.${fileExtension}`
    const filepath = join(AVATAR_DIR, filename)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Save avatar URL to database
    const avatarUrl = `/uploads/avatars/${filename}`
    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    })

    return NextResponse.json({ avatarUrl })
  } catch (error) {
    console.error('Failed to upload avatar:', error)
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    )
  }
}

