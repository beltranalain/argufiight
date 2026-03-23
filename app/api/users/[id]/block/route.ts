import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';

// POST /api/users/[id]/block - Block a user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: blockedUserId } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const blockerId = session.user.id;

    if (blockerId === blockedUserId) {
      return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 });
    }

    const blockedUser = await prisma.user.findUnique({
      where: { id: blockedUserId },
    });

    if (!blockedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));

    // Upsert block record
    await prisma.userBlock.upsert({
      where: {
        blockerId_blockedId: { blockerId, blockedId: blockedUserId },
      },
      create: {
        blockerId,
        blockedId: blockedUserId,
        reason: body.reason || null,
      },
      update: {},
    });

    // Also unfollow in both directions
    await prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: blockerId, followingId: blockedUserId },
          { followerId: blockedUserId, followingId: blockerId },
        ],
      },
    });

    return NextResponse.json({ success: true, blocked: true });
  } catch (error: any) {
    console.error('Failed to block user:', error);
    return NextResponse.json(
      { error: 'Failed to block user', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id]/block - Unblock a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: blockedUserId } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const blockerId = session.user.id;

    await prisma.userBlock.deleteMany({
      where: { blockerId, blockedId: blockedUserId },
    });

    return NextResponse.json({ success: true, blocked: false });
  } catch (error: any) {
    console.error('Failed to unblock user:', error);
    return NextResponse.json(
      { error: 'Failed to unblock user', details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/users/[id]/block - Check if user is blocked
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const currentUserId = session.user.id;

    const [isBlocked, isBlockedBy] = await Promise.all([
      prisma.userBlock.findUnique({
        where: { blockerId_blockedId: { blockerId: currentUserId, blockedId: userId } },
      }),
      prisma.userBlock.findUnique({
        where: { blockerId_blockedId: { blockerId: userId, blockedId: currentUserId } },
      }),
    ]);

    return NextResponse.json({
      isBlocked: !!isBlocked,
      isBlockedBy: !!isBlockedBy,
    });
  } catch (error: any) {
    console.error('Failed to check block status:', error);
    return NextResponse.json(
      { error: 'Failed to check block status', details: error.message },
      { status: 500 }
    );
  }
}
