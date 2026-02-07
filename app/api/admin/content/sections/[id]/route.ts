import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'
import { cache } from '@/lib/utils/cache'

export const dynamic = 'force-dynamic'

// PATCH /api/admin/content/sections/[id] - Update section
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await verifyAdmin()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Build update data object, only including fields that are explicitly provided
    const updateData: any = {}
    
    if (body.title !== undefined) updateData.title = body.title || null
    if (body.content !== undefined) updateData.content = body.content || null
    if (body.order !== undefined) updateData.order = body.order
    if (body.isVisible !== undefined) updateData.isVisible = body.isVisible
    if (body.metaTitle !== undefined) updateData.metaTitle = body.metaTitle || null
    if (body.metaDescription !== undefined) updateData.metaDescription = body.metaDescription || null
    if (body.contactEmail !== undefined) updateData.contactEmail = body.contactEmail || null

    // If no fields to update, return error
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    const section = await prisma.homepageSection.update({
      where: { id },
      data: updateData,
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
        buttons: {
          orderBy: { order: 'asc' },
        },
      },
    })

    // Clear homepage cache when section is updated
    cache.delete('homepage:sections')

    return NextResponse.json({ section })
  } catch (error) {
    console.error('Failed to update section:', error)
    return NextResponse.json(
      { error: 'Failed to update section' },
      { status: 500 }
    )
  }
}

