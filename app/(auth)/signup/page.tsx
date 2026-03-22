import type { Metadata } from 'next';
import Link from 'next/link';
import { SignupForm } from './signup-form';
import { JsonLd, createWebPageJsonLd } from '@/components/seo/json-ld';

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Join ArguFight — the AI-judged debate platform. Create a free account to start debating, earn ELO rankings, compete in tournaments, and win championship belts.',
  alternates: { canonical: '/signup' },
};

export default function SignupPage() {
  return (
    <>
      <JsonLd data={createWebPageJsonLd({
        name: 'Create an ArguFight Account',
        description: 'Sign up for ArguFight to start debating. Free account with ELO rankings, tournaments, and championship belts.',
        path: '/signup',
      })} />
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-[500] text-text">Create account</h2>
          <p className="text-xs text-text-3 mt-1">
            Join thousands of debaters. Free to start.
          </p>
        </div>

        <SignupForm />

        <p className="text-[13px] text-text-3 text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-accent hover:underline">Sign in</Link>
        </p>

        {/* SEO content — visible to crawlers, subtle to users */}
        <p className="text-[12px] text-text-3/60 leading-relaxed pt-4">
          Create your free ArguFight account and enter the arena. Challenge opponents to AI-judged debates, climb the ELO leaderboard, compete in bracket tournaments, and earn championship belts across categories like politics, sports, science, and technology. Three AI judges evaluate every debate on facts, logic, and persuasion — ensuring fair, unbiased verdicts every time.
        </p>
      </div>
    </>
  );
}
