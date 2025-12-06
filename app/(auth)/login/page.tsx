'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [userType, setUserType] = useState<string | null>(null)

  useEffect(() => {
    // Check if this is an advertiser or employee login
    const type = searchParams.get('userType')
    const errorParam = searchParams.get('error')
    
    // Also check referrer to detect if coming from admin or advertiser pages
    if (!type) {
      const referrer = document.referrer
      if (referrer.includes('/admin')) {
        setUserType('employee')
      } else if (referrer.includes('/advertiser')) {
        setUserType('advertiser')
      }
    } else {
      setUserType(type)
    }
    
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        oauth_denied: 'Google authentication was cancelled.',
        oauth_failed: 'Google authentication failed. Please try again.',
        oauth_not_configured: 'Google authentication is not configured.',
        token_exchange_failed: 'Failed to complete Google authentication.',
        no_id_token: 'Google authentication failed: No token received.',
        token_verification_failed: 'Failed to verify Google authentication.',
        invalid_token: 'Invalid Google authentication token.',
        no_email: 'Google account does not have an email address.',
        not_advertiser: 'This email is not associated with an advertiser account.',
        advertiser_not_approved: 'Your advertiser application is not yet approved.',
        not_employee: 'This email is not associated with an employee account.',
        user_not_found: 'User account not found. Please contact support.',
        oauth_error: 'An error occurred during Google authentication.',
      }
      setError(errorMessages[errorParam] || 'Authentication error occurred.')
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        throw new Error('Failed to parse server response')
      }

      if (!response.ok) {
        throw new Error(data.error || 'Invalid email or password')
      }

      if (!data.user) {
        throw new Error('Login failed: No user data received')
      }

      // Wait a moment for session cookie to be set, then redirect
      // Use window.location to ensure a full page reload so session is detected
      setTimeout(() => {
        if (data.user?.isAdmin) {
          window.location.href = '/admin'
        } else {
          window.location.href = '/'
        }
      }, 100)
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Invalid email or password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="bg-bg-secondary border border-bg-tertiary rounded-2xl p-10 relative group transition-all duration-300 hover:border-electric-blue hover:shadow-[0_8px_32px_rgba(0,217,255,0.15)]">
        {/* Gradient border on hover */}
        <div className="absolute inset-[-1px] bg-gradient-to-r from-electric-blue to-neon-orange rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300 -z-10" />

        <h2 className="text-2xl font-bold text-white mb-8">Sign In</h2>

        {/* Error Message */}
        {error && (
          <div className="bg-[#FF6B35]/10 border border-[#FF6B35]/30 rounded-lg p-3 mb-4">
            <p className="text-[#FF6B35] text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <Input
            type="email"
            label="Email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            type="password"
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="text-right -mt-4">
            <Link 
              href="/forgot-password" 
              className="text-electric-blue text-sm hover:text-neon-orange transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            className="w-full py-3.5 text-base"
            isLoading={isLoading}
          >
            Sign In
          </Button>
        </form>

        {/* Google OAuth Button (for advertisers and employees only) */}
        {(userType === 'advertiser' || userType === 'employee') && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-bg-tertiary"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-bg-secondary text-text-secondary">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              className="w-full py-3.5 text-base flex items-center justify-center gap-3"
              onClick={() => {
                const returnTo = userType === 'advertiser' ? '/advertiser/dashboard' : '/admin'
                window.location.href = `/api/auth/google?userType=${userType}&returnTo=${encodeURIComponent(returnTo)}`
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
          </>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-bg-tertiary text-center">
          <p className="text-text-secondary text-sm">
            Don't have an account?{' '}
            <Link 
              href="/signup" 
              className="text-electric-blue font-medium hover:text-neon-orange hover:underline transition-colors"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <AuthLayout>
        <div className="bg-bg-secondary border border-bg-tertiary rounded-2xl p-10">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-text-secondary">Loading...</div>
          </div>
        </div>
      </AuthLayout>
    }>
      <LoginForm />
    </Suspense>
  )
}

