import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from './login-form';
import { JsonLd, createWebPageJsonLd } from '@/components/seo/json-ld';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to ArguFight — the AI-judged debate platform. Access your debates, track your ELO ranking, defend championship belts, and challenge opponents.',
  alternates: { canonical: '/login' },
};

export default function LoginPage() {
  return (
    <>
      <JsonLd data={createWebPageJsonLd({
        name: 'Sign In to ArguFight',
        description: 'Sign in to access your debates, ELO rankings, and championship belts on ArguFight.',
        path: '/login',
      })} />
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-[500] text-text">Sign in</h2>
          <p className="text-xs text-text-3 mt-1">
            Welcome back. Enter your credentials to continue.
          </p>
        </div>

        <LoginForm />

        {/* Footer links */}
        <div className="flex flex-col gap-2 text-xs text-center">
          <Link
            href="/forgot-password"
            className="text-text-3 hover:text-text-2 transition-colors"
          >
            Forgot your password?
          </Link>
          <p className="text-text-3">
            No account?{' '}
            <Link
              href="/signup"
              className="text-accent hover:text-accent-2 transition-colors font-[450]"
            >
              Create one
            </Link>
          </p>
        </div>

        {/* SEO content — visible to crawlers, subtle to users */}
        <p className="text-[12px] text-text-3/60 leading-relaxed pt-4">
          ArguFight is the premier AI-judged debate platform. Sign in to access your profile, track your ELO ranking, participate in tournaments, defend your championship belts, and challenge opponents to structured debates judged by AI on logic, facts, and rhetoric.
        </p>
      </div>
    </>
  );
}
