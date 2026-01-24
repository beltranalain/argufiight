/**
 * Cron Job: Process Escrow Payments
 * Runs daily at 2 AM to release escrow payments to creators after review period
 *
 * Schedule: 0 2 * * * (daily at 2 AM)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
// TODO: Re-enable when creator Stripe accounts are implemented
// import { payoutToCreator } from '@/lib/stripe/stripe-client'

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
          select: { id: true, username: true, email: true },
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
        // TODO: Implement creator Stripe onboarding
        // Currently creators don't have Stripe accounts in the User model
        // For now, we'll mark contracts as ready for manual payout

        const totalAmount = Number(contract.totalAmount)
        const platformFee = Number(contract.platformFee)
        const creatorPayout = Number(contract.creatorPayout)

        console.log(`[Cron] Processing payout for contract ${contract.id}:`)
        console.log(`  Total: $${totalAmount.toFixed(2)}`)
        console.log(`  Platform Fee: $${platformFee.toFixed(2)}`)
        console.log(`  Creator Payout: $${creatorPayout.toFixed(2)}`)

        // TODO: Enable automatic Stripe transfers when creator Stripe accounts are implemented
        // const transfer = await payoutToCreator(
        //   totalAmount,
        //   platformFee,
        //   creatorStripeAccountId,
        //   `Payout for campaign: ${contract.campaign.name}`
        // )

        console.log(`[Cron] Contract ${contract.id} marked for manual payout (Stripe integration pending)`)

        // Update contract record
        await prisma.adContract.update({
          where: { id: contract.id },
          data: {
            payoutSent: true,
            payoutDate: now,
            escrowHeld: false, // Release escrow
            // stripePayoutId will be updated when manual payout is processed
          },
        })

        processedCount++
        paidAmount += creatorPayout

        console.log(`[Cron] Contract marked for payout to ${contract.creator.username}: $${creatorPayout.toFixed(2)} (manual processing required)`)

        // Send notification to creator
        await prisma.notification.create({
          data: {
            userId: contract.creator.id,
            type: 'OTHER',
            title: 'Payment Processing',
            message: `Your payment of $${creatorPayout.toFixed(2)} for campaign "${contract.campaign.name}" is being processed. You'll be contacted to complete payout setup.`,
          },
        })

        // Send notification to advertiser
        await prisma.notification.create({
          data: {
            userId: contract.advertiserId,
            type: 'OTHER',
            title: 'Campaign Payment Processing',
            message: `Payment of $${creatorPayout.toFixed(2)} for ${contract.creator.username}'s campaign "${contract.campaign.name}" is being processed.`,
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
              status: 'DISPUTED',
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
