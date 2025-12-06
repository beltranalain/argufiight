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
      // Check referrer
      if (typeof window !== 'undefined') {
        const referrer = document.referrer
        if (referrer && referrer.includes('/admin')) {
          setUserType('employee')
        } else if (referrer && referrer.includes('/advertiser')) {
          setUserType('advertiser')
        }
      }
    } else {
      setUserType(type)
    }
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('Login page - userType:', type || 'not set', 'detected:', userType)
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

      // Check if 2FA setup is required
      if (data.requires2FASetup) {
        // Redirect to 2FA setup page
        window.location.href = `/setup-2fa?userId=${data.userId}`
        return
      }

      // Check if 2FA verification is required
      if (data.requires2FA) {
        // Redirect to 2FA verification page
        window.location.href = `/verify-2fa?userId=${data.userId}`
        return
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

