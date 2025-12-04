import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'

// GET /api/admin/content/sections - Get all homepage sections
export async function GET() {
  try {
    const userId = await verifyAdmin()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sections = await prisma.homepageSection.findMany({
      include: {
        images: {
          orderBy: {
            order: 'asc',
          },
        },
        buttons: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    })

    return NextResponse.json({ sections })
  } catch (error) {
    console.error('Failed to fetch sections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sections' },
      { status: 500 }
    )
  }
}

