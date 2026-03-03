import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { after } from 'next/server';
import { getSession } from '@/lib/auth/get-session';
import { DashboardContent } from '@/components/features/dashboard/dashboard-content';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  // Trigger AI auto-accept in the background after response is sent.
  after(async () => {
    try {
      const { triggerAIAutoAccept } = await import('@/lib/ai/trigger-ai-accept');
      await triggerAIAutoAccept();
    } catch {
      // Non-critical background task
    }
  });

  return <DashboardContent userId={session.userId} />;
}
