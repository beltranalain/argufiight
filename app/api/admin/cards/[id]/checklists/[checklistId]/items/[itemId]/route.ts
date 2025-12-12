import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'

// PATCH /api/admin/cards/[id]/checklists/[checklistId]/items/[itemId] - Update checklist item
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; checklistId: string; itemId: string } }
) {
  try {
    const userId = await verifyAdmin()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { text, isCompleted } = body

    const item = await prisma.cardChecklistItem.update({
      where: { id: params.itemId },
      data: {
        ...(text !== undefined && { text }),
        ...(isCompleted !== undefined && { isCompleted }),
      },
    })

    return NextResponse.json({ item })
  } catch (error: any) {
    console.error('Failed to update checklist item:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update checklist item' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/cards/[id]/checklists/[checklistId]/items/[itemId] - Delete checklist item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; checklistId: string; itemId: string } }
) {
  try {
    const userId = await verifyAdmin()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.cardChecklistItem.delete({
      where: { id: params.itemId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to delete checklist item:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete checklist item' },
      { status: 500 }
    )
  }
}

