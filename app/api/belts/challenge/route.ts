/**
 * API Route: POST /api/belts/challenge
 * Create a belt challenge
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifySessionWithDb } from '@/lib/auth/session-verify'
import { createBeltChallenge } from '@/lib/belts/core'
import { calculateChallengeEntryFee } from '@/lib/belts/coin-economics'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await verifySessionWithDb()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Temporarily enable belt system for challenge operations
    const originalFlag = process.env.ENABLE_BELT_SYSTEM
    if (originalFlag !== 'true') {
      process.env.ENABLE_BELT_SYSTEM = 'true'
    }

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

    // Generate default topic if not provided (for simple challenge creation)
    let finalTopic = topic
    if (!finalTopic || typeof finalTopic !== 'string' || !finalTopic.trim().length) {
      // Get belt details for default topic
      const belt = await prisma.belt.findUnique({
        where: { id: beltId },
        select: { name: true, currentHolder: { select: { username: true } } },
      })
      if (belt) {
        finalTopic = `Challenge for ${belt.name}${belt.currentHolder ? ` held by ${belt.currentHolder.username}` : ''}`
        console.log('[API /belts/challenge] Generated default topic:', finalTopic)
      } else {
        finalTopic = `Belt Challenge for ${beltId}`
      }
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
          topic: finalTopic.trim(),
          description: description?.trim() || null,
          category: category || 'GENERAL',
          challengerPosition: challengerPosition || 'FOR',
          totalRounds: totalRounds || 5,
          roundDuration: roundDuration || (speedMode ? 300000 : 86400000), // 5 min for speed, 24h for normal
          speedMode: speedMode || false,
          allowCopyPaste: allowCopyPaste !== false, // Default true
        },
        true // Skip belt system check since we already enabled it in this route
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
    
    // Determine status code based on error type
    let statusCode = 500
    if (errorMessage.includes('Insufficient coins') || errorMessage.includes('no free challenge')) {
      statusCode = 400 // Bad request - user doesn't meet requirements
    } else if (errorMessage.includes('Unauthorized') || errorMessage.includes('Forbidden')) {
      statusCode = 403
    } else if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
      statusCode = 404
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error?.details || null,
      },
      { status: statusCode }
    )
  }
}
