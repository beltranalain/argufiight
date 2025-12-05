import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { headers } from 'next/headers'

// POST /api/ads/track - Track ad impressions and clicks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contractId, campaignId, type } = body

    if (!contractId || !campaignId || !type) {
      return NextResponse.json(
        { error: 'contractId, campaignId, and type are required' },
        { status: 400 }
      )
    }

    if (type !== 'IMPRESSION' && type !== 'CLICK') {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    // Get user info if available
    const headersList = await headers()
    const userId = headersList.get('x-user-id') || null // Would need to set this from session middleware

    // Get IP and user agent
    const ipAddress =
      headersList.get('x-forwarded-for')?.split(',')[0] ||
      headersList.get('x-real-ip') ||
      'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'
    const referrer = headersList.get('referer') || null

    // Create tracking record
    if (type === 'IMPRESSION') {
      await prisma.impression.create({
        data: {
          contractId: contractId || undefined,
          campaignId,
          userId: userId || undefined,
          ipAddress,
          userAgent,
          referrer,
        },
      })

      // Update contract impression count
      if (contractId) {
        await prisma.adContract.update({
          where: { id: contractId },
          data: {
            impressionsDelivered: {
              increment: 1,
            },
          },
        })
      }
    } else if (type === 'CLICK') {
      await prisma.click.create({
        data: {
          contractId: contractId || undefined,
          campaignId,
          userId: userId || undefined,
          ipAddress,
          userAgent,
          referrer,
        },
      })

      // Update contract click count
      if (contractId) {
        await prisma.adContract.update({
          where: { id: contractId },
          data: {
            clicksDelivered: {
              increment: 1,
            },
          },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to track ad event:', error)
    // Don't fail the request if tracking fails
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

