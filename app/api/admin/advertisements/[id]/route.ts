import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/db/prisma'
import { put } from '@vercel/blob'

// GET /api/admin/advertisements/[id] - Get a specific advertisement
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin()

    const { id } = await params

    const ad = await prisma.advertisement.findUnique({
      where: { id },
    })

    if (!ad) {
      return NextResponse.json(
        { error: 'Advertisement not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ ad })
  } catch (error: any) {
    console.error('Failed to fetch advertisement:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch advertisement' },
      { status: error.status || 500 }
    )
  }
}

// PUT /api/admin/advertisements/[id] - Update an advertisement
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin()

    const { id } = await params
    const formData = await request.formData()
    const title = formData.get('title') as string
    const type = formData.get('type') as string
    const targetUrl = formData.get('targetUrl') as string
    const status = formData.get('status') as string
    const startDate = formData.get('startDate') as string
    const endDate = formData.get('endDate') as string
    const category = formData.get('category') as string
    const file = formData.get('file') as File | null

    const updateData: any = {}
    if (title !== undefined) updateData.title = title.trim()
    if (type !== undefined) {
      if (!['BANNER', 'SPONSORED_DEBATE', 'IN_FEED'].includes(type)) {
        return NextResponse.json(
          { error: 'type must be BANNER, SPONSORED_DEBATE, or IN_FEED' },
          { status: 400 }
        )
      }
      updateData.type = type
    }
    if (targetUrl !== undefined) updateData.targetUrl = targetUrl.trim()
    if (status !== undefined) updateData.status = status
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null
    if (category !== undefined) updateData.category = category?.trim() || null

    if (file) {
      // Upload new file
      const blob = await put(`advertisements/${Date.now()}-${file.name}`, file, {
        access: 'public',
      })
      updateData.creativeUrl = blob.url
    } else {
      // Allow URL update
      const urlInput = formData.get('creativeUrl') as string
      if (urlInput) {
        updateData.creativeUrl = urlInput
      }
    }

    const ad = await prisma.advertisement.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ ad })
  } catch (error: any) {
    console.error('Failed to update advertisement:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update advertisement' },
      { status: error.status || 500 }
    )
  }
}

// DELETE /api/admin/advertisements/[id] - Delete an advertisement
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin()

    const { id } = await params

    await prisma.advertisement.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to delete advertisement:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete advertisement' },
      { status: error.status || 500 }
    )
  }
}

