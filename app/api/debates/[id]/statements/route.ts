import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { notifyDebateWatchers, notifyDebateParticipants, createDebateNotification } from '@/lib/notifications/debateNotifications';
import { calculateWordCount, updateUserAnalyticsOnStatement } from '@/lib/utils/analytics';
import crypto from 'crypto';

// GET /api/debates/[id]/statements - Get all statements for a debate
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const statements = await prisma.statement.findMany({
      where: { debateId: id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [
        { round: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    const formattedStatements = statements.map((stmt: any) => ({
      id: stmt.id,
      debateId: stmt.debateId,
      authorId: stmt.authorId,
      author: stmt.author,
      round: stmt.round,
      content: stmt.content,
      createdAt: stmt.createdAt.toISOString(),
      updatedAt: stmt.updatedAt.toISOString(),
    }));

    return NextResponse.json(formattedStatements);
  } catch (error) {
    console.error('Failed to fetch statements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statements' },
      { status: 500 }
    );
  }
}

// POST /api/debates/[id]/statements - Submit a statement/argument
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { content, round } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Get the debate
    const debate = await prisma.debate.findUnique({
      where: { id },
    });

    if (!debate) {
      return NextResponse.json(
        { error: 'Debate not found' },
        { status: 404 }
      );
    }

    if (debate.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Debate is not active' },
        { status: 400 }
      );
    }

    // Check if user is a participant
    if (debate.challengerId !== session.user.id && debate.opponentId !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not a participant in this debate' },
        { status: 403 }
      );
    }

    const statementRound = round || debate.currentRound;

    // Check if statement already exists for this round
    const existing = await prisma.statement.findUnique({
      where: {
        debateId_authorId_round: {
          debateId: id,
          authorId: session.user.id,
          round: statementRound,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'You have already submitted a statement for this round' },
        { status: 400 }
      );
    }

    // Calculate word count
    const wordCount = calculateWordCount(content)
    
    // Create statement
    const statement = await prisma.statement.create({
      data: {
        id: crypto.randomUUID(),
        debateId: id,
        authorId: session.user.id,
        round: statementRound,
        content: content.trim(),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Update user analytics (non-blocking)
    updateUserAnalyticsOnStatement(session.user.id, wordCount).catch(err => {
      console.error('Failed to update user analytics:', err)
    })

    // Check if both participants have submitted for this round
    const challengerStatement = await prisma.statement.findUnique({
      where: {
        debateId_authorId_round: {
          debateId: id,
          authorId: debate.challengerId,
          round: statementRound,
        },
      },
    });

    const opponentStatement = debate.opponentId ? await prisma.statement.findUnique({
      where: {
        debateId_authorId_round: {
          debateId: id,
          authorId: debate.opponentId,
          round: statementRound,
        },
      },
    }) : null;

    // If both have submitted, advance to next round or complete
    let updatedDebate = debate;
    if (challengerStatement && opponentStatement) {
      if (statementRound >= debate.totalRounds) {
        // Debate is complete - set to COMPLETED first (verdict generation will change to VERDICT_READY)
        updatedDebate = await prisma.debate.update({
          where: { id },
          data: {
            status: 'COMPLETED',
            endedAt: new Date(),
          },
        });

        // Trigger verdict generation automatically (direct function call)
        console.log(`[Debate Complete] Triggering automatic verdict generation for debate ${id}`)
        
        // Import and call the generate function directly (no network calls = more reliable)
        import('@/lib/verdicts/generate-initial').then(async (generateModule) => {
          try {
            console.log(`[Debate Complete] Starting direct verdict generation for debate ${id}`)
            const result = await generateModule.generateInitialVerdicts(id)
            console.log('✅ [Debate Complete] Verdict generation completed successfully:', {
              debateId: id,
              result,
              timestamp: new Date().toISOString(),
            })
          } catch (error: any) {
            console.error('❌ [Debate Complete] Error in direct verdict generation:', {
              debateId: id,
              error: error.message,
              stack: error.stack,
              timestamp: new Date().toISOString(),
            })
          }
        }).catch((importError: any) => {
          console.error('❌ [Debate Complete] Failed to import generate module:', importError.message)
          // Fallback to fetch if import fails (shouldn't happen, but safety net)
          let baseUrl = 'http://localhost:3000'
          if (process.env.NEXT_PUBLIC_APP_URL) {
            baseUrl = process.env.NEXT_PUBLIC_APP_URL
          } else if (process.env.VERCEL_URL) {
            baseUrl = `https://${process.env.VERCEL_URL}`
          }
          
          fetch(`${baseUrl}/api/verdicts/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ debateId: id }),
          }).catch((fetchError: any) => {
            console.error('❌ [Debate Complete] Fallback fetch also failed:', fetchError.message)
          })
        })

        // Notify participants and watchers
        await notifyDebateWatchers(
          id,
          'DEBATE_COMPLETE',
          'Debate Complete',
          'The debate has concluded. Verdicts are being generated!'
        );
        await notifyDebateParticipants(
          id,
          'DEBATE_COMPLETE',
          'Debate Complete',
          'The debate has concluded. Verdicts are being generated!'
        );
      } else {
        // Advance to next round
        updatedDebate = await prisma.debate.update({
          where: { id },
          data: {
            currentRound: statementRound + 1,
            roundDeadline: new Date(Date.now() + debate.roundDuration),
          },
        });

        // Notify the other participant it's their turn
        const userIsChallenger = debate.challengerId === session.user.id;
        const otherParticipantId = userIsChallenger
          ? updatedDebate.opponentId
          : updatedDebate.challengerId;
        
        if (otherParticipantId) {
          await createDebateNotification(
            id,
            otherParticipantId,
            'DEBATE_TURN',
            "It's Your Turn",
            `Round ${updatedDebate.currentRound} has started. It's your turn to submit an argument.`
          );
        }

        // Notify watchers of new round
        await notifyDebateWatchers(
          id,
          'NEW_ROUND',
          'New Round Started',
          `Round ${updatedDebate.currentRound} has begun!`,
          session.user.id
        );
      }
    } else {
      // Notify the other participant it's their turn
      const userIsChallenger = debate.challengerId === session.user.id;
      const otherParticipantId = userIsChallenger
        ? debate.opponentId
        : debate.challengerId;
      
      if (otherParticipantId) {
        await createDebateNotification(
          id,
          otherParticipantId,
          'OPPONENT_SUBMITTED',
          'New Argument Submitted',
          `${session.user.username} submitted their argument. It's your turn!`
        );
      }

      // Notify watchers
      await notifyDebateWatchers(
        id,
        'OPPONENT_SUBMITTED',
        'New Argument Submitted',
        `${session.user.username} submitted a new argument in round ${statementRound}`,
        session.user.id
      );
    }

    // Fetch updated debate state to return to client
    const updatedDebateForResponse = await prisma.debate.findUnique({
      where: { id },
      include: {
        challenger: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            eloRating: true,
          },
        },
        opponent: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            eloRating: true,
          },
        },
      },
    });

    const formattedStatement = {
      id: statement.id,
      debateId: statement.debateId,
      authorId: statement.authorId,
      author: statement.author,
      round: statement.round,
      content: statement.content,
      createdAt: statement.createdAt.toISOString(),
      updatedAt: statement.updatedAt.toISOString(),
    };

    const formattedDebate = updatedDebateForResponse ? {
      id: updatedDebateForResponse.id,
      topic: updatedDebateForResponse.topic,
      description: updatedDebateForResponse.description,
      category: updatedDebateForResponse.category,
      challengerId: updatedDebateForResponse.challengerId,
      opponentId: updatedDebateForResponse.opponentId,
      challenger: updatedDebateForResponse.challenger,
      opponent: updatedDebateForResponse.opponent,
      challengerPosition: updatedDebateForResponse.challengerPosition,
      opponentPosition: updatedDebateForResponse.opponentPosition,
      totalRounds: updatedDebateForResponse.totalRounds,
      currentRound: updatedDebateForResponse.currentRound,
      status: updatedDebateForResponse.status,
      spectatorCount: updatedDebateForResponse.spectatorCount,
      featured: updatedDebateForResponse.featured,
      createdAt: updatedDebateForResponse.createdAt.toISOString(),
      startedAt: updatedDebateForResponse.startedAt?.toISOString(),
      endedAt: updatedDebateForResponse.endedAt?.toISOString(),
      roundDeadline: updatedDebateForResponse.roundDeadline?.toISOString(),
      winnerId: updatedDebateForResponse.winnerId,
      verdictReached: updatedDebateForResponse.verdictReached,
    } : null;

    return NextResponse.json({
      statement: formattedStatement,
      debate: formattedDebate,
    });
  } catch (error: any) {
    console.error('Failed to create statement:', error);
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'You have already submitted a statement for this round' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create statement' },
      { status: 500 }
    );
  }
}

