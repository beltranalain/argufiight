import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { unstable_cache } from 'next/cache';

const getLinks = unstable_cache(
  async () => {
    const settings = await prisma.adminSetting.findMany({
      where: { key: { in: ['APP_STORE_URL', 'PLAY_STORE_URL'] } },
      select: { key: true, value: true },
    });
    return Object.fromEntries(settings.map(s => [s.key, s.value]));
  },
  ['app-store-links'],
  { revalidate: 600 } // 10 minutes
);

export async function GET() {
  const links = await getLinks();
  return NextResponse.json({
    appStoreUrl: links['APP_STORE_URL'] || null,
    playStoreUrl: links['PLAY_STORE_URL'] || null,
  });
}
