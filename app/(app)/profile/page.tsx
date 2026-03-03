import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/get-session';

export const dynamic = 'force-dynamic';

// /profile → redirect to current user's profile
export default async function ProfileRedirect() {
  const session = await getSession();
  if (!session) redirect('/login');
  redirect(`/profile/${session.userId}`);
}
