import type { Metadata } from 'next';
import { prisma } from '@/lib/db/prisma';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Admin — Notifications' };
export const revalidate = 60;

function formatType(type: string) {
  return type
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

export default async function AdminNotificationsPage() {
  const [total, unread, notifications] = await Promise.all([
    prisma.notification.count().catch(() => 0),
    prisma.notification.count({ where: { read: false } }).catch(() => 0),
    prisma.notification.findMany({
      take: 30,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { username: true } },
      },
    }).catch(() => []),
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto">

      <div className="mb-6">
        <h1 className="text-xl font-[600] text-text tracking-[-0.3px]">Notifications</h1>
        <p className="text-[15px] text-text-3 mt-0.5">
          {total.toLocaleString()} total &middot; {unread.toLocaleString()} unread
        </p>
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="grid grid-cols-[2fr_1.5fr_3fr_1fr_1fr] gap-4 px-4 py-2.5 border-b border-border bg-surface-2">
          <p className="text-[13px] font-[500] text-text-3 uppercase tracking-wide">User</p>
          <p className="text-[13px] font-[500] text-text-3 uppercase tracking-wide">Type</p>
          <p className="text-[13px] font-[500] text-text-3 uppercase tracking-wide">Title</p>
          <p className="text-[13px] font-[500] text-text-3 uppercase tracking-wide">Status</p>
          <p className="text-[13px] font-[500] text-text-3 uppercase tracking-wide">Date</p>
        </div>

        {notifications.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-[15px] text-text-3">No notifications found.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((n) => {
              const type = (n as { type?: string | null }).type ?? 'INFO';
              const title = (n as { title?: string | null }).title ?? (n as { message?: string | null }).message ?? '—';
              const isRead = n.read ?? false;

              return (
                <div
                  key={n.id}
                  className="grid grid-cols-[2fr_1.5fr_3fr_1fr_1fr] gap-4 px-4 py-3 items-center hover:bg-surface-2 transition-colors duration-100"
                >
                  <p className="text-[15px] text-text font-[450] truncate">
                    {n.user?.username ?? '—'}
                  </p>

                  <p className="text-[15px] text-text-2 truncate">
                    {formatType(type)}
                  </p>

                  <p className="text-[15px] text-text-2 line-clamp-1">
                    {title.length > 70 ? title.slice(0, 70) + '…' : title}
                  </p>

                  <p className={`text-[15px] ${isRead ? 'text-text-3' : 'text-accent font-[500]'}`}>
                    {isRead ? 'Read' : 'Unread'}
                  </p>

                  <p className="text-[15px] text-text-3">
                    {new Date(n.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: '2-digit',
                    })}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {notifications.length === 30 && (
        <p className="text-[15px] text-text-3 text-center mt-4">Showing first 30 results.</p>
      )}
    </div>
  );
}
