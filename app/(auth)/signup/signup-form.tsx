'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { Separator } from '@/components/ui/separator';
import { Chrome } from 'lucide-react';

export function SignupForm() {
  const router = useRouter();
  const { error } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  function update(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreedToTerms) { error('Terms required', 'You must agree to the Terms of Service and Privacy Policy'); return; }
    if (!form.username.trim() || !form.email.trim() || !form.password) return;
    if (form.password.length < 8) { error('Password too short', 'Min. 8 characters'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        error('Signup failed', d.error ?? 'Please try again');
        return;
      }
      router.push('/onboarding');
    } finally {
      setLoading(false);
    }
  }

  function handleGoogle() {
    if (!agreedToTerms) { error('Terms required', 'You must agree to the Terms of Service and Privacy Policy'); return; }
    window.location.href = '/api/auth/google';
  }

  return (
    <div className="space-y-4">
      <Button variant="secondary" size="md" fullWidth onClick={handleGoogle} type="button">
        <Chrome size={14} />
        Continue with Google
      </Button>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-[13px] text-text-3">or</span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="label block mb-1.5">Username</label>
          <Input
            value={form.username}
            onChange={(e) => update('username', e.target.value)}
            placeholder="Choose a username"
            autoComplete="username"
          />
        </div>
        <div>
          <label className="label block mb-1.5">Email</label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>
        <div>
          <label className="label block mb-1.5">Password</label>
          <Input
            type="password"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            placeholder="Min. 8 characters"
            autoComplete="new-password"
          />
        </div>
        <label className="flex items-start gap-2.5 cursor-pointer select-none mt-1">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-[var(--accent)] rounded border-[var(--border)] flex-shrink-0"
          />
          <span className="text-[13px] text-text-3 leading-[1.5]">
            I agree to the{' '}
            <a href="/terms" target="_blank" className="text-accent hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" target="_blank" className="text-accent hover:underline">Privacy Policy</a>
          </span>
        </label>
        <Button variant="accent" size="md" fullWidth type="submit" loading={loading} disabled={!agreedToTerms}>
          Create account
        </Button>
      </form>
    </div>
  );
}
