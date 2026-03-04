import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Topnav } from '@/components/layout/topnav';
import { ProfilePanel } from '@/components/layout/profile-panel';
import { ProfilePanelSkeleton } from '@/components/layout/profile-panel-skeleton';
import { RankingsPanel } from '@/components/layout/rankings-panel';
import { RankingsPanelSkeleton } from '@/components/layout/rankings-panel-skeleton';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { CreateDebateButton } from '@/components/features/debate/create-debate-button';
import { PushBanner } from '@/components/features/push/push-banner';
import { Providers } from '@/lib/providers';
import { getSession } from '@/lib/auth/get-session';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <Providers>
      <div className="min-h-screen bg-bg">
        {/* Sticky top nav */}
        <Topnav
          user={{
            id:        session.userId,
            username:  session.username ?? 'User',
            avatarUrl: session.avatarUrl ?? null,
            coins:     session.coins ?? 0,
            eloRating: session.eloRating ?? 1200,
            isAdmin:   session.isAdmin ?? false,
          }}
        />

        {/* Responsive shell: single column on mobile, 3-column on lg+ */}
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_220px]">
          {/* Left: Profile panel — hidden on mobile */}
          <div className="hidden lg:block">
            <Suspense fallback={<ProfilePanelSkeleton />}>
              <ProfilePanel userId={session.userId} />
            </Suspense>
          </div>

          {/* Center: page content */}
          <main
            id="main-content"
            tabIndex={-1}
            className="min-w-0 overflow-x-hidden overflow-y-auto pb-36 lg:pb-0"
            style={{ minHeight: 'calc(100vh - 58px)' }}
          >
            <PushBanner />
            {children}
          </main>

          {/* Right: Rankings panel — hidden on mobile */}
          <div className="hidden lg:block">
            <Suspense fallback={<RankingsPanelSkeleton />}>
              <RankingsPanel userId={session.userId} />
            </Suspense>
          </div>
        </div>

        {/* Mobile FAB — create debate */}
        <div className="fixed right-4 bottom-20 z-50 lg:hidden">
          <CreateDebateButton variant="fab" />
        </div>

        {/* Mobile bottom tab bar */}
        <MobileBottomNav />
      </div>
    </Providers>
  );
}
