import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'

// PATCH /api/admin/cards/[id]/custom-fields/[fieldId] - Update custom field
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; fieldId: string } }
) {
  try {
    const userId = await verifyAdmin()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, value, fieldType } = body

    const customField = await prisma.cardCustomField.update({
      where: { id: params.fieldId },
      data: {
        ...(name !== undefined && { name }),
        ...(value !== undefined && { value }),
        ...(fieldType !== undefined && { fieldType }),
      },
    })

    return NextResponse.json({ customField })
  } catch (error: any) {
    console.error('Failed to update custom field:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update custom field' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/cards/[id]/custom-fields/[fieldId] - Remove custom field
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; fieldId: string } }
) {
  try {
    const userId = await verifyAdmin()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.cardCustomField.delete({
      where: { id: params.fieldId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to remove custom field:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to remove custom field' },
      { status: 500 }
    )
  }
}

