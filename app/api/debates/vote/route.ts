import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import crypto from 'crypto';

// POST /api/debates/vote - Vote on a debate (predict winner)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const session = await getSession(token);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { debateId, predictedWinnerId } = await request.json();

    if (!debateId || !predictedWinnerId) {
      return NextResponse.json(
        { error: 'Debate ID and predicted winner ID are required' },
        { status: 400 }
      );
    }

    // Get debate
    const debate = await prisma.debate.findUnique({
      where: { id: debateId },
      include: {
        challenger: { select: { id: true, username: true } },
        opponent: { select: { id: true, username: true } },
      },
    });

    if (!debate) {
      return NextResponse.json(
        { error: 'Debate not found' },
        { status: 404 }
      );
    }

    // Check if user is a participant (can't vote on own debate)
    if (
      debate.challengerId === session.user.id ||
      debate.opponentId === session.user.id
    ) {
      return NextResponse.json(
        { error: 'Participants cannot vote on their own debate' },
        { status: 400 }
      );
    }

    // Check if debate is still active (can only vote on active debates)
    if (debate.status !== 'ACTIVE' && debate.status !== 'WAITING') {
      return NextResponse.json(
        { error: 'Can only vote on active debates' },
        { status: 400 }
      );
    }

    // Check if predicted winner is valid
    if (
      predictedWinnerId !== debate.challengerId &&
      predictedWinnerId !== debate.opponentId
    ) {
      return NextResponse.json(
        { error: 'Invalid predicted winner' },
        { status: 400 }
      );
    }

    // Vote feature not implemented - debateVote model doesn't exist
    return NextResponse.json(
      { error: 'Vote feature not yet implemented' },
      { status: 501 }
    )
  } catch (error) {
    console.error('Failed to vote on debate:', error);
    return NextResponse.json(
      { error: 'Failed to vote on debate' },
      { status: 500 }
    );
  }
}

// GET /api/debates/vote?debateId=xxx - Get user's vote and vote counts
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const session = await getSession(token);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const debateId = searchParams.get('debateId');

    if (!debateId) {
      return NextResponse.json(
        { error: 'Debate ID is required' },
        { status: 400 }
      );
    }

    // Vote feature not implemented - debateVote model doesn't exist
    return NextResponse.json({
      userVote: null,
      voteCounts: {
        challenger: 0,
        opponent: 0,
        total: 0,
      },
    });
  } catch (error: any) {
    console.error('Failed to get vote:', error);
    console.error('Error details:', error.message, error.stack);
    return NextResponse.json(
      { error: 'Failed to get vote', details: error.message },
      { status: 500 }
    );
  }
}

