/**
 * Core belt system logic
 * Handles belt creation, transfers, challenges, and status management
 */

import { prisma } from '@/lib/db/prisma'
import type { BeltType, BeltStatus, ChallengeStatus, BeltTransferReason } from '@prisma/client'
import { deductCoins } from './coin-economics'
import { generateUniqueSlug } from '@/lib/utils/slug'
import crypto from 'crypto'

// Feature flag check
function isBeltSystemEnabled(): boolean {
  return process.env.ENABLE_BELT_SYSTEM === 'true'
}

/**
 * Check and reset free belt challenges for a user (weekly reset)
 */
async function checkAndResetFreeChallenges(userId: string): Promise<{ hasFreeChallenge: boolean; available: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      freeBeltChallengesAvailable: true,
      lastFreeChallengeReset: true,
    },
  })

  if (!user) {
    return { hasFreeChallenge: false, available: 0 }
  }

  const now = new Date()
  const lastReset = user.lastFreeChallengeReset

  // Check if we need to reset (7 days have passed since last reset, or never reset)
  const shouldReset = !lastReset || (now.getTime() - lastReset.getTime()) >= 7 * 24 * 60 * 60 * 1000

  if (shouldReset) {
    // Reset to 1 free challenge
    await prisma.user.update({
      where: { id: userId },
      data: {
        freeBeltChallengesAvailable: 1,
        lastFreeChallengeReset: now,
      },
    })
    return { hasFreeChallenge: true, available: 1 }
  }

  return {
    hasFreeChallenge: user.freeBeltChallengesAvailable > 0,
    available: user.freeBeltChallengesAvailable,
  }
}

/**
 * Get belt settings for a specific belt type
 */
export async function getBeltSettings(beltType: BeltType) {
  let settings = await prisma.beltSettings.findUnique({
    where: { beltType },
  })

  // If settings don't exist, create defaults instead of throwing
  if (!settings) {
    console.warn(`[getBeltSettings] Settings not found for ${beltType}, creating defaults`)
    settings = await prisma.beltSettings.create({
      data: {
        beltType,
        // Default values
        defensePeriodDays: 30,
        inactivityDays: 30,
        mandatoryDefenseDays: 60,
        gracePeriodDays: 30,
        maxDeclines: 2,
        challengeCooldownDays: 7,
        challengeExpiryDays: 3,
        eloRange: 200,
        activityRequirementDays: 30,
        winStreakBonusMultiplier: 1.2,
        entryFeeBase: 100,
        entryFeeMultiplier: 1.0,
        winnerRewardPercent: 60,
        loserConsolationPercent: 30,
        platformFeePercent: 10,
        tournamentBeltCostSmall: 500,
        tournamentBeltCostMedium: 1000,
        tournamentBeltCostLarge: 2000,
        inactiveCompetitorCount: 2,
        inactiveAcceptDays: 7,
        requireCoins: false,
        requireFreeChallenge: false,
        allowFreeChallenges: true,
        freeChallengesPerWeek: 1,
      },
    })
  }

  return settings
}

/**
 * Create a new belt
 */
export async function createBelt(data: {
  name: string
  type: BeltType
  category?: string
  tournamentId?: string
  creationCost?: number
  createdBy?: string
  designImageUrl?: string
  designColors?: Record<string, string>
  sponsorId?: string
  sponsorName?: string
  sponsorLogoUrl?: string
}) {
  if (!isBeltSystemEnabled()) {
    throw new Error('Belt system is not enabled')
  }

  const belt = await prisma.belt.create({
    data: {
      name: data.name,
      type: data.type,
      category: data.category || null,
      tournamentId: data.tournamentId || null,
      status: 'VACANT',
      creationCost: data.creationCost || 0,
      coinValue: data.creationCost || 0,
      designImageUrl: data.designImageUrl || null,
      designColors: data.designColors ? (data.designColors as any) : null,
      sponsorId: data.sponsorId || null,
      sponsorName: data.sponsorName || null,
      sponsorLogoUrl: data.sponsorLogoUrl || null,
    },
  })

  return belt
}

/**
 * Transfer belt from one user to another
 */
export async function transferBelt(
  beltId: string,
  fromUserId: string | null,
  toUserId: string | null,
  reason: BeltTransferReason,
  context: {
    debateId?: string
    tournamentId?: string
    daysHeld?: number
    defensesWon?: number
    defensesLost?: number
    adminNotes?: string
    transferredBy?: string
  }
) {
  if (!isBeltSystemEnabled()) {
    throw new Error('Belt system is not enabled')
  }

  const belt = await prisma.belt.findUnique({
    where: { id: beltId },
    include: { currentHolder: true },
  })

  if (!belt) {
    throw new Error('Belt not found')
  }

  // Verify fromUserId matches current holder (if belt has a holder)
  if (belt.currentHolderId && fromUserId !== belt.currentHolderId) {
    throw new Error('Belt holder mismatch')
  }

  // Calculate stats if not provided
  const daysHeld = context.daysHeld ?? 0
  const defensesWon = context.defensesWon ?? 0
  const defensesLost = context.defensesLost ?? 0

  // Create belt history record
  const history = await prisma.beltHistory.create({
    data: {
      beltId,
      fromUserId: fromUserId || null,
      toUserId: toUserId || null,
      reason,
      debateId: context.debateId || null,
      tournamentId: context.tournamentId || null,
      daysHeld,
      defensesWon,
      defensesLost,
      adminNotes: context.adminNotes || null,
      transferredBy: context.transferredBy || null,
    },
  })

  // Update belt
  const now = new Date()
  const updatedBelt = await prisma.belt.update({
    where: { id: beltId },
    data: {
      currentHolderId: toUserId || null,
      status: toUserId ? 'ACTIVE' : 'VACANT',
      acquiredAt: toUserId ? now : null,
      lastDefendedAt: null,
      nextDefenseDue: null,
      inactiveAt: null,
      isStaked: false,
      stakedInDebateId: null,
      stakedInTournamentId: null,
      gracePeriodEnds: toUserId && belt.isFirstHolder ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) : null,
      isFirstHolder: belt.isFirstHolder && toUserId === null ? false : belt.isFirstHolder,
    },
  })

  // Update user stats
  if (fromUserId) {
    await prisma.user.update({
      where: { id: fromUserId },
      data: {
        currentBeltsCount: {
          decrement: 1,
        },
      },
    })
  }

  if (toUserId) {
    const user = await prisma.user.findUnique({
      where: { id: toUserId },
      select: { currentBeltsCount: true },
    })

    await prisma.user.update({
      where: { id: toUserId },
      data: {
        currentBeltsCount: (user?.currentBeltsCount || 0) + 1,
        totalBeltWins: {
          increment: 1,
        },
      },
    })

    // Send notification to new belt holder
    try {
      const { createBeltTransferNotification } = await import('@/lib/notifications/beltNotifications')
      await createBeltTransferNotification(
        beltId,
        toUserId,
        belt.name,
        reason
      )
    } catch (error) {
      console.error('Failed to send belt transfer notification:', error)
    }
  }

  return { belt: updatedBelt, history }
}

/**
 * Create a belt challenge
 */
export async function createBeltChallenge(
  beltId: string,
  challengerId: string,
  entryFee: number,
  debateDetails?: {
    topic: string
    description?: string | null
    category?: string
    challengerPosition?: string
    totalRounds?: number
    roundDuration?: number
    speedMode?: boolean
    allowCopyPaste?: boolean
  },
  skipBeltSystemCheck: boolean = false // Allow bypassing the check when called from API routes
) {
  if (!skipBeltSystemCheck && !isBeltSystemEnabled()) {
    throw new Error('Belt system is not enabled')
  }

  const belt = await prisma.belt.findUnique({
    where: { id: beltId },
    include: {
      currentHolder: true,
      challenges: {
        where: {
          status: 'PENDING',
        },
      },
    },
  })

  if (!belt) {
    throw new Error('Belt not found')
  }

  if (!belt.currentHolderId) {
    throw new Error('Belt has no current holder')
  }

  if (belt.currentHolderId === challengerId) {
    throw new Error('Cannot challenge your own belt')
  }

  if (belt.status !== 'ACTIVE' && belt.status !== 'MANDATORY') {
    throw new Error(`Cannot challenge belt with status: ${belt.status}`)
  }

  if (belt.isStaked) {
    throw new Error('Belt is currently staked in a debate or tournament')
  }

  // Check for existing pending challenge
  const existingChallenge = belt.challenges.find(
    (c) => c.challengerId === challengerId && c.status === 'PENDING'
  )

  if (existingChallenge) {
    throw new Error('You already have a pending challenge for this belt')
  }

  // Get belt settings (will be used later for coin checks)
  const beltSettings = await getBeltSettings(belt.type)

  // Get challenger and holder ELO
  const challenger = await prisma.user.findUnique({
    where: { id: challengerId },
    select: { eloRating: true },
  })

  const holder = await prisma.user.findUnique({
    where: { id: belt.currentHolderId },
    select: { eloRating: true },
  })

  if (!challenger || !holder) {
    throw new Error('User not found')
  }

  // ELO matching check (anti-abuse) - DISABLED: Users can challenge any belt holder regardless of ELO
  const eloDifference = Math.abs(challenger.eloRating - holder.eloRating)
  // Note: ELO restriction removed to allow challenges regardless of rating difference
  // const allowedRange = settings.eloRange
  // if (eloDifference > allowedRange) {
  //   throw new Error(
  //     `ELO difference too large (${eloDifference} > ${allowedRange}). You can only challenge users within ${allowedRange} ELO points.`
  //   )
  // }

  // Calculate coin reward
  const coinReward = Math.floor(
    entryFee * (beltSettings.winnerRewardPercent / 100)
  )

  // Calculate expiration date
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + beltSettings.challengeExpiryDays)

  // Get belt settings to check requirements (already have it above)
  const settings = beltSettings
  
  // Check coin/free challenge requirements based on admin settings
  let hasFreeChallenge = false
  let requiresCoins = settings.requireCoins ?? false
  let requiresFreeChallenge = settings.requireFreeChallenge ?? false
  let allowsFreeChallenges = settings.allowFreeChallenges ?? true
  
  // Check if user has a free challenge available (if allowed)
  if (allowsFreeChallenges) {
    const freeChallengeCheck = await checkAndResetFreeChallenges(challengerId)
    hasFreeChallenge = freeChallengeCheck.hasFreeChallenge
  }

  // Check coin requirements only if admin has enabled it
  if (requiresCoins) {
    const challengerWithCoins = await prisma.user.findUnique({
      where: { id: challengerId },
      select: { coins: true },
    })

    const hasEnoughCoins = challengerWithCoins && challengerWithCoins.coins >= entryFee

    // If coins required but user doesn't have enough
    if (!hasEnoughCoins) {
      // Check if free challenge is allowed and available
      if (allowsFreeChallenges && hasFreeChallenge) {
        // User can use free challenge, continue
        console.log(`[createBeltChallenge] User has free challenge available, allowing challenge creation`)
      } else if (requiresFreeChallenge && !hasFreeChallenge) {
        // Admin requires free challenge but user doesn't have one
        throw new Error(`Insufficient coins (need ${entryFee} coins) and no free challenge available. You get ${settings.freeChallengesPerWeek || 1} free challenge(s) per week.`)
      } else if (!allowsFreeChallenges) {
        // Free challenges disabled, must have coins
        throw new Error(`Insufficient coins. Entry fee is ${entryFee} coins. Free challenges are disabled for this belt type.`)
      } else {
        // Coins required, no free challenge available
        throw new Error(`Insufficient coins. Entry fee is ${entryFee} coins. You have ${settings.freeChallengesPerWeek || 1} free challenge(s) per week that can be used when your challenge is accepted.`)
      }
    }
  }
  
  // If admin doesn't require coins, allow challenge creation regardless
  if (!requiresCoins) {
    console.log(`[createBeltChallenge] Coin requirements disabled by admin, allowing challenge creation`)
  }

  // Don't deduct coins upfront - only charge when challenge is accepted
  // If using free challenge, mark it but don't consume it yet
  // If using coins, we'll deduct when challenge is accepted

  // Create challenge (mark if using free challenge, store debate details)
  const challenge = await prisma.beltChallenge.create({
    data: {
      beltId,
      challengerId,
      beltHolderId: belt.currentHolderId,
      entryFee,
      coinReward,
      challengerElo: challenger.eloRating,
      holderElo: holder.eloRating,
      eloDifference,
      expiresAt,
      status: 'PENDING',
      usesFreeChallenge: hasFreeChallenge, // Mark if using free challenge (only consumed when accepted)
      // Store debate details
      debateTopic: debateDetails?.topic,
      debateDescription: debateDetails?.description || null,
      debateCategory: debateDetails?.category,
      debateTotalRounds: debateDetails?.totalRounds,
      debateRoundDuration: debateDetails?.roundDuration,
      debateSpeedMode: debateDetails?.speedMode,
      debateAllowCopyPaste: debateDetails?.allowCopyPaste,
      debateChallengerPosition: debateDetails?.challengerPosition,
    },
  })

  // Send notification to belt holder
  try {
    const challengerUser = await prisma.user.findUnique({
      where: { id: challengerId },
      select: { username: true },
    })
    if (challengerUser && belt.currentHolderId) {
      const { createBeltChallengeNotification } = await import('@/lib/notifications/beltNotifications')
      await createBeltChallengeNotification(
        challenge.id,
        belt.currentHolderId,
        challengerUser.username,
        belt.name
      )
    }
  } catch (error) {
    // Don't fail challenge creation if notification fails
    console.error('Failed to send challenge notification:', error)
  }

  return challenge
}

/**
 * Accept a belt challenge
 */
export async function acceptBeltChallenge(challengeId: string) {
  if (!isBeltSystemEnabled()) {
    throw new Error('Belt system is not enabled')
  }

  const challenge = await prisma.beltChallenge.findUnique({
    where: { id: challengeId },
    include: {
      belt: {
        include: { currentHolder: true },
      },
    },
  })

  if (!challenge) {
    throw new Error('Challenge not found')
  }

  if (challenge.status !== 'PENDING') {
    throw new Error(`Challenge is not pending (status: ${challenge.status})`)
  }

  if (new Date() > challenge.expiresAt) {
    throw new Error('Challenge has expired')
  }

  // Use debate topic from challenge, or generate default
  const topic = challenge.debateTopic || `Belt Challenge: ${challenge.belt.name}`
  const description = challenge.debateDescription || null
  const category = challenge.debateCategory || 'GENERAL'
  const challengerPosition = challenge.debateChallengerPosition || 'FOR'
  const opponentPosition = challengerPosition === 'FOR' ? 'AGAINST' : 'FOR'
  const totalRounds = challenge.debateTotalRounds || 5
  const roundDuration = challenge.debateRoundDuration || (challenge.debateSpeedMode ? 300000 : 86400000) // 5 min for speed, 24h for normal
  const speedMode = challenge.debateSpeedMode || false
  const allowCopyPaste = challenge.debateAllowCopyPaste !== false // Default true
  
  // Generate unique slug
  let slug = generateUniqueSlug(topic)
  
  // Ensure slug is unique
  let slugExists = await prisma.debate.findUnique({ where: { slug } })
  let counter = 1
  while (slugExists) {
    slug = generateUniqueSlug(topic, Math.random().toString(36).substring(2, 8))
    slugExists = await prisma.debate.findUnique({ where: { slug } })
    counter++
    if (counter > 100) {
      slug = generateUniqueSlug(topic, crypto.randomBytes(4).toString('hex'))
      break
    }
  }

  // TESTING MODE: Skip coin restrictions in development or if SKIP_BELT_COIN_CHECKS is enabled
  const skipCoinChecks = process.env.NODE_ENV === 'development' || process.env.SKIP_BELT_COIN_CHECKS === 'true'
  
  if (skipCoinChecks) {
    console.log(`[acceptBeltChallenge] TESTING MODE: Skipping coin checks and deductions`)
  } else {
    // Now charge the challenger (coins or consume free challenge) since challenge is accepted
    // Check if this challenge was marked to use free challenge
    if (challenge.usesFreeChallenge) {
      // Verify user still has a free challenge available (in case they used it on another challenge that was accepted first)
      const user = await prisma.user.findUnique({
        where: { id: challenge.challengerId },
        select: { freeBeltChallengesAvailable: true },
      })
      
      if (user && user.freeBeltChallengesAvailable > 0) {
        // Consume the free challenge
        await prisma.user.update({
          where: { id: challenge.challengerId },
          data: {
            freeBeltChallengesAvailable: {
              decrement: 1,
            },
          },
        })
        console.log(`[acceptBeltChallenge] Consumed free challenge for user ${challenge.challengerId}`)
      } else {
        // Free challenge was already consumed (another challenge was accepted first)
        // Fall back to charging coins
        console.log(`[acceptBeltChallenge] Free challenge already consumed, charging coins for user ${challenge.challengerId}`)
        try {
          await deductCoins(challenge.challengerId, challenge.entryFee, {
            type: 'BELT_CHALLENGE_ENTRY',
            description: `Entry fee for challenging ${challenge.belt.name}`,
            beltId: challenge.beltId,
            metadata: {
              beltName: challenge.belt.name,
              beltType: challenge.belt.type,
              entryFee: challenge.entryFee,
            },
          })
          console.log(`[acceptBeltChallenge] Deducted ${challenge.entryFee} coins from challenger ${challenge.challengerId}`)
        } catch (error: any) {
          if (error.message === 'Insufficient coins') {
            throw new Error(`Challenger no longer has sufficient coins. Entry fee is ${challenge.entryFee} coins.`)
          }
          throw error
        }
      }
    } else {
      // Deduct coins from challenger
      try {
        await deductCoins(challenge.challengerId, challenge.entryFee, {
          type: 'BELT_CHALLENGE_ENTRY',
          description: `Entry fee for challenging ${challenge.belt.name}`,
          beltId: challenge.beltId,
          metadata: {
            beltName: challenge.belt.name,
            beltType: challenge.belt.type,
            entryFee: challenge.entryFee,
          },
        })
        console.log(`[acceptBeltChallenge] Deducted ${challenge.entryFee} coins from challenger ${challenge.challengerId}`)
      } catch (error: any) {
        if (error.message === 'Insufficient coins') {
          throw new Error(`Challenger no longer has sufficient coins. Entry fee is ${challenge.entryFee} coins.`)
        }
        throw error
      }
    }
  }

  // Create debate with belt at stake using challenger's provided details
  // Since both participants are known (challenger and belt holder), start as ACTIVE
  const now = new Date()
  const deadline = new Date(now.getTime() + roundDuration)
  
  const debate = await prisma.debate.create({
    data: {
      topic,
      slug,
      description,
      category: category as any,
      challengerId: challenge.challengerId,
      challengerPosition: challengerPosition as any,
      opponentPosition: opponentPosition as any,
      opponentId: challenge.beltHolderId,
      totalRounds,
      roundDuration,
      speedMode,
      allowCopyPaste,
      isPrivate: false,
      challengeType: 'DIRECT',
      invitedUserIds: JSON.stringify([challenge.beltHolderId]),
      invitedBy: challenge.challengerId,
      status: 'ACTIVE', // Start immediately since both participants are known
      startedAt: now,
      currentRound: 1,
      roundDeadline: deadline,
      hasBeltAtStake: true,
      beltStakeType: 'CHALLENGE',
    },
  })

  // Update challenge with debate ID
  const updatedChallenge = await prisma.beltChallenge.update({
    where: { id: challengeId },
    data: {
      status: 'ACCEPTED',
      response: 'ACCEPTED',
      respondedAt: new Date(),
      debateId: debate.id,
    },
  })

  // Mark belt as staked and link to debate
  await prisma.belt.update({
    where: { id: challenge.beltId },
    data: {
      isStaked: true,
      status: 'STAKED',
      stakedInDebateId: debate.id,
    },
  })

  // Send notification to challenger
  try {
    const holderUser = await prisma.user.findUnique({
      where: { id: challenge.beltHolderId },
      select: { username: true },
    })
    if (holderUser) {
      const { createBeltChallengeAcceptedNotification } = await import('@/lib/notifications/beltNotifications')
      await createBeltChallengeAcceptedNotification(
        challenge.id,
        challenge.challengerId,
        holderUser.username,
        challenge.belt.name
      )
    }
  } catch (error) {
    // Don't fail if notification fails
    console.error('Failed to send challenge accepted notification:', error)
  }

  return { challenge: updatedChallenge, debate }
}

/**
 * Decline a belt challenge
 */
export async function declineBeltChallenge(challengeId: string) {
  // Allow challenge decline - belt system should work regardless of flag

  const challenge = await prisma.beltChallenge.findUnique({
    where: { id: challengeId },
    include: {
      belt: true,
    },
  })

  if (!challenge) {
    throw new Error('Challenge not found')
  }

  if (challenge.status !== 'PENDING') {
    throw new Error(`Challenge is not pending (status: ${challenge.status})`)
  }

  const settings = await getBeltSettings(challenge.belt.type)
  const newDeclineCount = challenge.declineCount + 1

  // Check if max declines reached
  if (newDeclineCount >= settings.maxDeclines) {
    // Belt becomes mandatory defense
    await prisma.belt.update({
      where: { id: challenge.beltId },
      data: {
        status: 'MANDATORY',
        nextDefenseDue: new Date(
          Date.now() + settings.mandatoryDefenseDays * 24 * 60 * 60 * 1000
        ),
      },
    })

    // Send notification to belt holder
    if (challenge.belt.currentHolderId) {
      try {
        const { createMandatoryDefenseNotification } = await import('@/lib/notifications/beltNotifications')
        await createMandatoryDefenseNotification(
          challenge.beltId,
          challenge.belt.currentHolderId,
          challenge.belt.name
        )
      } catch (error) {
        console.error('Failed to send mandatory defense notification:', error)
      }
    }
  }

  // Update challenge
  await prisma.beltChallenge.update({
    where: { id: challengeId },
    data: {
      status: 'DECLINED',
      response: 'DECLINED',
      respondedAt: new Date(),
      declineCount: newDeclineCount,
    },
  })

  return challenge
}

/**
 * Process belt transfer after debate completion
 */
export async function processBeltTransferAfterDebate(
  debateId: string,
  winnerId: string
) {
  if (!isBeltSystemEnabled()) {
    return // Silently skip if disabled
  }

  const debate = await prisma.debate.findUnique({
    where: { id: debateId },
    include: {
      stakedBelt: {
        include: { currentHolder: true },
      },
      beltChallenge: true,
      challenger: true,
      opponent: true,
    },
  })

  if (!debate || !debate.hasBeltAtStake || !debate.stakedBelt) {
    return // No belt at stake
  }

  const belt = debate.stakedBelt
  const fromUserId = belt.currentHolderId
  const toUserId = winnerId

  if (!fromUserId) {
    throw new Error('Belt has no current holder')
  }

  // Calculate days held
  const acquiredAt = belt.acquiredAt || new Date()
  const daysHeld = Math.floor(
    (Date.now() - acquiredAt.getTime()) / (24 * 60 * 60 * 1000)
  )

  // Determine transfer reason
  let reason: BeltTransferReason = 'DEBATE_WIN'
  if (debate.beltChallenge) {
    reason = 'CHALLENGE_WIN'
  } else if (debate.beltStakeType === 'TOURNAMENT') {
    reason = 'TOURNAMENT_WIN'
  } else if (debate.beltStakeType === 'MANDATORY') {
    reason = 'MANDATORY_LOSS'
  }

  // Transfer belt
  await transferBelt(belt.id, fromUserId, toUserId, reason, {
    debateId,
    daysHeld,
    defensesWon: belt.successfulDefenses,
    defensesLost: belt.timesDefended - belt.successfulDefenses,
  })

  // Update belt challenge if exists
  if (debate.beltChallenge) {
    await prisma.beltChallenge.update({
      where: { id: debate.beltChallenge.id },
      data: {
        status: 'COMPLETED',
      },
    })
  }

  // Unstake belt
  await prisma.belt.update({
    where: { id: belt.id },
    data: {
      isStaked: false,
      stakedInDebateId: null,
      status: 'ACTIVE',
      lastDefendedAt: new Date(),
      timesDefended: {
        increment: 1,
      },
      successfulDefenses: fromUserId === winnerId ? { increment: 1 } : undefined,
    },
  })
}

/**
 * Check and process inactive belts
 */
export async function checkInactiveBelts() {
  if (!isBeltSystemEnabled()) {
    return { beltsMarkedInactive: 0 }
  }

  const now = new Date()
  let beltsMarkedInactive = 0

  // Find belts that should be inactive
  const beltsToCheck = await prisma.belt.findMany({
    where: {
      status: 'ACTIVE',
      currentHolderId: { not: null },
      lastDefendedAt: { not: null },
    },
    include: {
      currentHolder: true,
    },
  })

  for (const belt of beltsToCheck) {
    if (!belt.lastDefendedAt || !belt.currentHolderId) continue

    const settings = await getBeltSettings(belt.type)
    const daysSinceDefense = Math.floor(
      (now.getTime() - belt.lastDefendedAt.getTime()) / (24 * 60 * 60 * 1000)
    )

    if (daysSinceDefense >= settings.inactivityDays) {
      // Mark belt as inactive
      await prisma.belt.update({
        where: { id: belt.id },
        data: {
          status: 'INACTIVE',
          inactiveAt: now,
        },
      })
      beltsMarkedInactive++

      // Send notification to belt holder
      if (belt.currentHolderId) {
        try {
          const { createBeltInactiveNotification } = await import('@/lib/notifications/beltNotifications')
          await createBeltInactiveNotification(
            belt.id,
            belt.currentHolderId,
            belt.name
          )
        } catch (error) {
          console.error('Failed to send inactive belt notification:', error)
        }
      }
    }
  }

  return { beltsMarkedInactive }
}

/**
 * Get user's belt room (all belts they've held)
 */
export async function getUserBeltRoom(userId: string) {
  // Allow users to view their belts regardless of feature flag
  // The flag should only control new operations, not viewing existing data

  // First, let's check the raw database values for debugging
  const rawCheck = await prisma.$queryRaw<Array<{ id: string; name: string; category: string | null; design_image_url: string | null }>>`
    SELECT id, name, category, design_image_url FROM belts WHERE current_holder_id = ${userId} AND status IN ('ACTIVE', 'MANDATORY', 'STAKED', 'GRACE_PERIOD')
  `
  console.log('[getUserBeltRoom] Raw SQL check - belts with images:')
  rawCheck.forEach((row) => {
    console.log(`  Belt ${row.id} (${row.name}): design_image_url =`, row.design_image_url)
    // Specifically check for SPORTS belt
    if (row.name?.includes('SPORTS') || row.category === 'SPORTS') {
      console.log(`[getUserBeltRoom] *** SPORTS BELT FOUND IN RAW SQL ***`)
      console.log(`[getUserBeltRoom] SPORTS Belt ID: ${row.id}`)
      console.log(`[getUserBeltRoom] SPORTS Belt name: ${row.name}`)
      console.log(`[getUserBeltRoom] SPORTS Belt category: ${row.category}`)
      console.log(`[getUserBeltRoom] SPORTS Belt design_image_url from DB: ${row.design_image_url}`)
    }
  })

  const currentBelts = await prisma.belt.findMany({
    where: {
      currentHolderId: userId,
      status: { in: ['ACTIVE', 'MANDATORY', 'STAKED', 'GRACE_PERIOD'] },
    },
    select: {
      id: true,
      name: true,
      type: true,
      category: true,
      status: true,
      coinValue: true,
      designImageUrl: true, // Explicitly select designImageUrl
      currentHolderId: true,
      acquiredAt: true,
      lastDefendedAt: true,
      nextDefenseDue: true,
      inactiveAt: true,
      timesDefended: true,
      successfulDefenses: true,
      totalDaysHeld: true,
      gracePeriodEnds: true,
      isFirstHolder: true,
      isStaked: true,
      stakedInDebateId: true,
      stakedInTournamentId: true,
      tournamentId: true,
      designColors: true,
      sponsorId: true,
      sponsorName: true,
      sponsorLogoUrl: true,
      creationCost: true,
      isActive: true,
      adminNotes: true,
      createdAt: true,
      updatedAt: true,
      tournament: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      acquiredAt: 'desc',
    },
  })
  
  console.log('[getUserBeltRoom] Fetched belts via Prisma:', currentBelts.length)
  currentBelts.forEach((belt) => {
    console.log(`[getUserBeltRoom] Belt ${belt.id} (${belt.name}): designImageUrl =`, belt.designImageUrl, 'type:', typeof belt.designImageUrl)
  })

  const history = await prisma.beltHistory.findMany({
    where: {
      OR: [{ fromUserId: userId }, { toUserId: userId }],
    },
    include: {
      belt: {
        select: {
          id: true,
          name: true,
          type: true,
          designImageUrl: true, // Explicitly include designImageUrl for history
          tournament: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      fromUser: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
      toUser: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
      debate: {
        select: {
          id: true,
          topic: true,
        },
      },
      tournament: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      transferredAt: 'desc',
    },
    take: 50, // Limit to recent history
  })

  return { currentBelts, history }
}
