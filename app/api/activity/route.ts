import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';

// GET /api/activity - Get user activity feed
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type'); // 'all', 'debates', 'comments', 'likes'

    const userId = session.user.id;

    // Get user's followed users
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);

    // Include current user's activity
    const allUserIds = [userId, ...followingIds];

    const activities: any[] = [];

    // Get recent debates created by followed users or user
    if (!type || type === 'all' || type === 'debates') {
      const recentDebates = await prisma.debate.findMany({
        where: {
          challengerId: { in: allUserIds },
        },
        include: {
          challenger: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      recentDebates.forEach((debate) => {
        activities.push({
          id: `debate-${debate.id}`,
          type: 'DEBATE_CREATED',
          userId: debate.challengerId,
          user: debate.challenger,
          debateId: debate.id,
          debate: {
            id: debate.id,
            topic: debate.topic,
            category: debate.category,
          },
          timestamp: debate.createdAt,
        });
      });
    }

    // Get recent comments by followed users or user
    if (!type || type === 'all' || type === 'comments') {
      const recentComments = await prisma.debateComment.findMany({
        where: {
          userId: { in: allUserIds },
          deleted: false,
        },
        include: {
          user: {
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
              category: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      recentComments.forEach((comment) => {
        activities.push({
          id: `comment-${comment.id}`,
          type: 'COMMENT_ADDED',
          userId: comment.userId,
          user: comment.user,
          debateId: comment.debateId,
          debate: comment.debate,
          content: comment.content.substring(0, 100),
          timestamp: comment.createdAt,
        });
      });
    }

    // Get recent likes by followed users or user
    if (!type || type === 'all' || type === 'likes') {
      const recentLikes = await prisma.debateLike.findMany({
        where: {
          userId: { in: allUserIds },
        },
        include: {
          user: {
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
              category: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      recentLikes.forEach((like) => {
        activities.push({
          id: `like-${like.id}`,
          type: 'DEBATE_LIKED',
          userId: like.userId,
          user: like.user,
          debateId: like.debateId,
          debate: like.debate,
          timestamp: like.createdAt,
        });
      });
    }

    // Get recent debate completions
    if (!type || type === 'all' || type === 'debates') {
      const completedDebates = await prisma.debate.findMany({
        where: {
          OR: [
            { challengerId: { in: allUserIds } },
            { opponentId: { in: allUserIds } },
          ],
          status: 'COMPLETED',
        },
        include: {
          challenger: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          opponent: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { endedAt: 'desc' },
        take: 10,
      });

      completedDebates.forEach((debate) => {
        activities.push({
          id: `completed-${debate.id}`,
          type: 'DEBATE_COMPLETED',
          userId: debate.winnerId || debate.challengerId,
          user: debate.winnerId === debate.challengerId
            ? debate.challenger
            : debate.opponent,
          debateId: debate.id,
          debate: {
            id: debate.id,
            topic: debate.topic,
            category: debate.category,
          },
          winnerId: debate.winnerId,
          timestamp: debate.endedAt || debate.updatedAt,
        });
      });
    }

    // Sort all activities by timestamp
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Take top N
    const limitedActivities = activities.slice(0, limit);

    // Format response
    const formatted = limitedActivities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      userId: activity.userId,
      user: activity.user,
      debateId: activity.debateId,
      debate: activity.debate,
      content: activity.content,
      winnerId: activity.winnerId,
      timestamp: activity.timestamp.toISOString(),
    }));

    return NextResponse.json({
      activities: formatted,
      total: activities.length,
    });
  } catch (error) {
    console.error('Failed to fetch activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}



