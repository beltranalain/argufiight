/**
 * API Route: POST /api/belts/challenge
 * Create a belt challenge
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifySessionWithDb } from '@/lib/auth/session-verify'
import { createBeltChallenge } from '@/lib/belts/core'
import { calculateChallengeEntryFee } from '@/lib/belts/coin-economics'

export async function POST(request: NextRequest) {
  try {
    const session = await verifySessionWithDb()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Allow challenge creation - belt system should work regardless of flag
    // The flag should only control advanced features, not basic operations

    const body = await request.json()
    console.log('[API /belts/challenge] Request body:', JSON.stringify(body, null, 2))
    
    const { 
      beltId, 
      entryFee,
      // Debate details
      topic,
      description,
      category,
      challengerPosition,
      totalRounds,
      roundDuration,
      speedMode,
      allowCopyPaste
    } = body

    console.log('[API /belts/challenge] Extracted topic:', topic, 'Type:', typeof topic, 'Length:', topic?.length)

    if (!beltId) {
      return NextResponse.json({ error: 'Belt ID is required' }, { status: 400 })
    }

    if (!topic || typeof topic !== 'string' || !topic.trim().length) {
      console.error('[API /belts/challenge] Topic validation failed:', { topic, type: typeof topic, length: topic?.length })
      return NextResponse.json({ error: 'Debate topic is required' }, { status: 400 })
    }

    // Calculate entry fee if not provided
    let finalEntryFee = entryFee
    if (!finalEntryFee) {
      finalEntryFee = await calculateChallengeEntryFee(beltId)
    }

    // Create challenge with debate details
    let challenge
    try {
      challenge = await createBeltChallenge(
        beltId, 
        session.userId, 
        finalEntryFee,
        {
          topic: topic.trim(),
          description: description?.trim() || null,
          category: category || 'GENERAL',
          challengerPosition: challengerPosition || 'FOR',
          totalRounds: totalRounds || 5,
          roundDuration: roundDuration || (speedMode ? 300000 : 86400000), // 5 min for speed, 24h for normal
          speedMode: speedMode || false,
          allowCopyPaste: allowCopyPaste !== false, // Default true
        }
      )
    } finally {
      // Restore original flag value
      if (originalFlag !== 'true') {
        process.env.ENABLE_BELT_SYSTEM = originalFlag || ''
      }
    }

    return NextResponse.json({ challenge })
  } catch (error: any) {
    console.error('[API /belts/challenge] Error creating challenge:', error)
    console.error('[API /belts/challenge] Error stack:', error.stack)
    const errorMessage = error?.message || error?.toString() || 'Failed to create challenge'
    return NextResponse.json(
      { error: errorMessage },
      { status: error?.statusCode || 500 }
    )
  }
}
