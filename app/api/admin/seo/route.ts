import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'

// GET /api/admin/seo - Get SEO settings
export async function GET() {
  try {
    const userId = await verifyAdmin()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all SEO-related admin settings
    const seoSettings = await prisma.adminSetting.findMany({
      where: {
        key: {
          startsWith: 'seo_',
        },
      },
    })

    // Convert to object
    const settings: Record<string, string> = {}
    seoSettings.forEach((setting) => {
      const key = setting.key.replace('seo_', '')
      settings[key] = setting.value || ''
    })

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Failed to fetch SEO settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SEO settings' },
      { status: 500 }
    )
  }
}

// POST /api/admin/seo - Save SEO settings
export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAdmin()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const settings = body.settings || body

    // Save each setting
    for (const [key, value] of Object.entries(settings)) {
      await prisma.adminSetting.upsert({
        where: {
          key: `seo_${key}`,
        },
        update: {
          value: String(value || ''),
        },
        create: {
          key: `seo_${key}`,
          value: String(value || ''),
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save SEO settings:', error)
    return NextResponse.json(
      { error: 'Failed to save SEO settings' },
      { status: 500 }
    )
  }
}

