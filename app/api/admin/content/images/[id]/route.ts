import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'

// PATCH /api/admin/content/images/[id] - Update image
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body = await request.json()

    // Update image with provided fields
    const image = await prisma.homepageImage.update({
      where: { id },
      data: {
        ...(body.alt !== undefined && { alt: body.alt || null }),
        ...(body.caption !== undefined && { caption: body.caption || null }),
        ...(body.linkUrl !== undefined && { linkUrl: body.linkUrl || null }),
        ...(body.order !== undefined && { order: body.order }),
        ...(body.imagePosition !== undefined && { imagePosition: body.imagePosition || 'left' }),
      },
    })

    return NextResponse.json({ image })
  } catch (error) {
    console.error('Failed to update image:', error)
    return NextResponse.json(
      { error: 'Failed to update image' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/content/images/[id] - Delete image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    console.log('Attempting to delete image with ID:', id)

    // First check if it's a homepageImage
    let image = await prisma.homepageImage.findUnique({
      where: { id },
    })

    if (!image) {
      console.log('Image not found in homepageImage table, checking MediaLibrary...')
      // Check if it exists in MediaLibrary instead
      const mediaItem = await prisma.mediaLibrary.findUnique({
        where: { id },
      })
      
      if (mediaItem) {
        console.log('Found in MediaLibrary, deleting from there')
        // Delete file
        try {
          const filepath = join(process.cwd(), 'public', mediaItem.url)
          await unlink(filepath)
        } catch (error) {
          console.error('Failed to delete file:', error)
        }
        
        await prisma.mediaLibrary.delete({
          where: { id },
        })
        return NextResponse.json({ success: true })
      }
      
      // List all images to help debug
      const allImages = await prisma.homepageImage.findMany({
        select: { id: true, url: true },
      })
      console.log('Available homepage images:', allImages.map(i => ({ id: i.id, url: i.url })))
      
      return NextResponse.json({ 
        error: 'Image not found',
        debug: { searchedId: id, availableIds: allImages.map(i => i.id) }
      }, { status: 404 })
    }

    console.log('Found image:', image.url)

    // Delete file from filesystem
    try {
      const filepath = join(process.cwd(), 'public', image.url)
      await unlink(filepath)
    } catch (error) {
      // File might not exist, continue with database deletion
      console.error('Failed to delete file:', error)
    }

    // Delete from database
    await prisma.homepageImage.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete image:', error)
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    )
  }
}

