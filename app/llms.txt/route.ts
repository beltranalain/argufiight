import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Try admin_settings first (editable version)
    const setting = await prisma.adminSetting.findUnique({
      where: { key: 'seo_geo_llms_txt_content' },
    })

    if (setting?.value) {
      return new NextResponse(setting.value, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        },
      })
    }

    // Fall back to static file
    const filePath = path.join(process.cwd(), 'public', 'llms.txt')
    const content = fs.readFileSync(filePath, 'utf-8')

    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Error serving llms.txt:', error)
    return new NextResponse('# ArguFight\n\nVisit https://www.argufight.com', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}
