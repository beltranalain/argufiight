import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'

// POST /api/admin/cards/[id]/attachments - Add attachment to card
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await verifyAdmin()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, url, type, mimeType, fileSize } = body

    if (!name || !url) {
      return NextResponse.json({ error: 'Name and URL are required' }, { status: 400 })
    }

    const attachment = await prisma.cardAttachment.create({
      data: {
        cardId: params.id,
        name,
        url,
        type: type || 'link',
        mimeType,
        fileSize,
        uploadedBy: userId,
      },
    })

    return NextResponse.json({ attachment })
  } catch (error: any) {
    console.error('Failed to add attachment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add attachment' },
      { status: 500 }
    )
  }
}

// GET /api/admin/cards/[id]/attachments - Get all attachments for a card
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await verifyAdmin()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const attachments = await prisma.cardAttachment.findMany({
      where: { cardId: params.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ attachments })
  } catch (error: any) {
    console.error('Failed to fetch attachments:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch attachments' },
      { status: 500 }
    )
  }
}

