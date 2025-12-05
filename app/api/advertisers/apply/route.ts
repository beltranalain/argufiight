import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { isCreatorMarketplaceEnabled } from '@/lib/ads/config'

// POST /api/advertisers/apply - Submit advertiser application
export async function POST(request: NextRequest) {
  try {
    // Check if creator marketplace is enabled
    const marketplaceEnabled = await isCreatorMarketplaceEnabled()
    if (!marketplaceEnabled) {
      return NextResponse.json(
        { error: 'Creator Marketplace is currently disabled' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { companyName, website, industry, contactName, contactEmail, businessEIN } = body

    // Validation
    if (!companyName || !website || !industry || !contactName || !contactEmail) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existing = await prisma.advertiser.findUnique({
      where: { contactEmail },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'An application with this email already exists' },
        { status: 400 }
      )
    }

    // Create advertiser application
    const advertiser = await prisma.advertiser.create({
      data: {
        companyName: companyName.trim(),
        website: website.trim(),
        industry: industry.trim(),
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim().toLowerCase(),
        businessEIN: businessEIN?.trim() || null,
        status: 'PENDING',
      },
    })

    // TODO: Send notification email to admins
    // TODO: Send confirmation email to advertiser

    return NextResponse.json(
      {
        success: true,
        advertiser: {
          id: advertiser.id,
          companyName: advertiser.companyName,
          status: advertiser.status,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Failed to create advertiser application:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to submit application' },
      { status: 500 }
    )
  }
}

