import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/get-session';
import { MarketingHomePage } from '@/components/features/marketing/homepage';
import { JsonLd, organizationJsonLd, websiteJsonLd } from '@/components/seo/json-ld';

/**
 * Root page:
 * - Authenticated users → /dashboard
 * - Visitors → marketing homepage
 */
export default async function RootPage() {
  const session = await getSession();

  if (session) {
    redirect('/dashboard');
  }

  return (
    <>
      <JsonLd data={organizationJsonLd} />
      <JsonLd data={websiteJsonLd} />
      <MarketingHomePage />
    </>
  );
}
