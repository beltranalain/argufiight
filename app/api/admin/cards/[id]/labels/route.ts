import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'

// POST /api/admin/cards/[id]/labels - Add a label to a card
export async function POST(
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
    const { name, color } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Label name is required' },
        { status: 400 }
      )
    }

    const label = await prisma.cardLabel.create({
      data: {
        cardId: id,
        name,
        color: color || '#61bd4f',
      },
    })

    return NextResponse.json({ label })
  } catch (error: any) {
    console.error('Failed to create label:', error)
    return NextResponse.json(
      { error: 'Failed to create label' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/cards/[id]/labels/[labelId] - Remove a label from a card
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; labelId: string }> }
) {
  try {
    const userId = await verifyAdmin()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { labelId } = await params
    await prisma.cardLabel.delete({
      where: { id: labelId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to delete label:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Failed to delete label' },
      { status: 500 }
    )
  }
}

