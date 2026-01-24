/**
 * Cron Job: Process Escrow Payments
 * Runs daily at 2 AM to release escrow payments to creators after review period
 *
 * Schedule: 0 2 * * * (daily at 2 AM)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { payoutToCreator } from '@/lib/stripe/stripe-client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('[Cron] Starting escrow processing...')

    const now = new Date()
    const reviewPeriodDays = 7 // 7-day review period

    // Calculate cutoff date (campaigns completed more than 7 days ago)
    const cutoffDate = new Date(now)
    cutoffDate.setDate(cutoffDate.getDate() - reviewPeriodDays)

    // Find contracts eligible for payout
    const eligibleContracts = await prisma.adContract.findMany({
      where: {
        status: 'COMPLETED',
        escrowHeld: true,
        payoutSent: false,
        completedAt: {
          lte: cutoffDate, // Completed at least 7 days ago
        },
      },
      include: {
        advertiser: {
          select: { companyName: true, contactEmail: true },
        },
        creator: {
          select: { id: true, username: true, email: true, stripeAccountId: true },
        },
        campaign: {
          select: { name: true },
        },
      },
    })

    console.log(`[Cron] Found ${eligibleContracts.length} contracts eligible for payout`)

    let processedCount = 0
    let paidAmount = 0
    const errors: string[] = []

    // Process each eligible contract
    for (const contract of eligibleContracts) {
      try {
        // Verify creator has Stripe account
        if (!contract.creator.stripeAccountId) {
          const errorMsg = `Creator ${contract.creator.username} has no Stripe account`
          console.warn(`[Cron] Skipping contract ${contract.id}: ${errorMsg}`)
          errors.push(errorMsg)
          continue
        }

        const totalAmount = Number(contract.totalAmount)
        const platformFee = Number(contract.platformFee)
        const creatorPayout = Number(contract.creatorPayout)

        console.log(`[Cron] Processing payout for contract ${contract.id}:`)
        console.log(`  Total: $${totalAmount.toFixed(2)}`)
        console.log(`  Platform Fee: $${platformFee.toFixed(2)}`)
        console.log(`  Creator Payout: $${creatorPayout.toFixed(2)}`)

        // Transfer funds to creator via Stripe
        const transfer = await payoutToCreator(
          totalAmount,
          platformFee,
          contract.creator.stripeAccountId,
          `Payout for campaign: ${contract.campaign.name}`
        )

        console.log(`[Cron] Stripe transfer successful: ${transfer.id}`)

        // Update contract record
        await prisma.adContract.update({
          where: { id: contract.id },
          data: {
            payoutSent: true,
            payoutDate: now,
            stripePayoutId: transfer.id,
            escrowHeld: false, // Release escrow
          },
        })

        processedCount++
        paidAmount += creatorPayout

        console.log(`[Cron] Payout sent to ${contract.creator.username}: $${creatorPayout.toFixed(2)}`)

        // Send notification to creator
        await prisma.notification.create({
          data: {
            userId: contract.creator.id,
            type: 'OTHER',
            title: 'Payment Received',
            message: `You received $${creatorPayout.toFixed(2)} for your campaign "${contract.campaign.name}"`,
          },
        })

        // Send notification to advertiser
        await prisma.notification.create({
          data: {
            userId: contract.advertiserId,
            type: 'OTHER',
            title: 'Campaign Payment Completed',
            message: `Payment of $${creatorPayout.toFixed(2)} has been sent to ${contract.creator.username} for "${contract.campaign.name}"`,
          },
        })

      } catch (error: any) {
        const errorMsg = `Failed to process contract ${contract.id}: ${error.message}`
        console.error(`[Cron] ${errorMsg}`)
        errors.push(errorMsg)

        // If Stripe transfer failed, mark contract for manual review
        try {
          await prisma.adContract.update({
            where: { id: contract.id },
            data: {
              status: 'FAILED',
            },
          })

          // Notify admin about failed payout
          const admins = await prisma.user.findMany({
            where: { isAdmin: true },
            select: { id: true },
          })

          for (const admin of admins) {
            await prisma.notification.create({
              data: {
                userId: admin.id,
                type: 'OTHER',
                title: 'Payout Failed',
                message: `Failed to process payout for contract ${contract.id}. Manual review required.`,
              },
            })
          }
        } catch (updateError) {
          console.error(`[Cron] Failed to update contract status:`, updateError)
        }
      }
    }

    const summary = {
      success: true,
      timestamp: now.toISOString(),
      reviewPeriodDays,
      found: eligibleContracts.length,
      processed: processedCount,
      totalPaid: paidAmount.toFixed(2),
      errors: errors.length > 0 ? errors : undefined,
    }

    console.log('[Cron] Escrow processing complete:', summary)

    return NextResponse.json(summary)

  } catch (error: any) {
    console.error('[Cron] Escrow processing failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process escrow',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
