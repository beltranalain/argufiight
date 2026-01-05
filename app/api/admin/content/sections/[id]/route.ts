import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'
import { cache } from '@/lib/utils/cache'

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

    const section = await prisma.homepageSection.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title : undefined,
        content: body.content !== undefined ? body.content : undefined,
        order: body.order !== undefined ? body.order : undefined,
        isVisible: body.isVisible !== undefined ? body.isVisible : undefined,
        metaTitle: body.metaTitle !== undefined ? body.metaTitle : undefined,
        metaDescription: body.metaDescription !== undefined ? body.metaDescription : undefined,
        contactEmail: body.contactEmail !== undefined ? body.contactEmail : undefined,
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

