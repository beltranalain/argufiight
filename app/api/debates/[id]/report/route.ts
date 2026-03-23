import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';

// POST /api/debates/[id]/report - Report a debate
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const { reason, description } = await request.json();

    if (!reason) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
    }

    // Check if debate exists
    const debate = await prisma.debate.findUnique({
      where: { id },
    });

    if (!debate) {
      return NextResponse.json({ error: 'Debate not found' }, { status: 404 });
    }

    // Check if user already reported this debate
    const existingReport = await prisma.report.findFirst({
      where: { debateId: id, reporterId: session.user.id },
    });

    if (existingReport) {
      return NextResponse.json({
        success: true,
        message: 'You have already reported this debate.',
      });
    }

    // Create report in database
    const report = await prisma.report.create({
      data: {
        debateId: id,
        reporterId: session.user.id,
        reason,
        description: description || null,
        status: 'PENDING',
      },
    });

    // Trigger AI auto-review (async, don't wait)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.argufight.com';
    fetch(`${baseUrl}/api/moderation/auto-review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId: report.id }),
    }).catch((error) => {
      console.error('Failed to trigger AI auto-review:', error);
    });

    return NextResponse.json({
      success: true,
      message: 'Report submitted successfully. Our moderators will review it.',
    });
  } catch (error) {
    console.error('Failed to submit report:', error);
    return NextResponse.json(
      { error: 'Failed to submit report' },
      { status: 500 }
    );
  }
}
