'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

function Verify2FAForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams.get('userId')
  
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!code || code.length !== 6) {
      setError('Please enter a 6-digit code')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: code, userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invalid verification code')
      }

      // 2FA verified, redirect to dashboard
      setTimeout(() => {
        // Check if user is admin or advertiser to redirect appropriately
        fetch('/api/auth/me')
          .then(res => res.json())
          .then(userData => {
            if (userData.user?.isAdmin) {
              window.location.href = '/admin'
            } else {
              // Check if advertiser
              fetch('/api/advertiser/me')
                .then(advRes => {
                  if (advRes.ok) {
                    return advRes.json()
                  }
                  return { advertiser: null }
                })
                .then(advData => {
                  if (advData.advertiser) {
                    window.location.href = '/advertiser/dashboard'
                  } else {
                    window.location.href = '/'
                  }
                })
                .catch(() => {
                  window.location.href = '/'
                })
            }
          })
          .catch(() => {
            window.location.href = '/'
          })
      }, 100)
    } catch (err: any) {
      console.error('2FA verification error:', err)
      setError(err.message || 'Invalid verification code')
      setCode('') // Clear code on error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="bg-bg-secondary border border-bg-tertiary rounded-2xl p-10 relative group transition-all duration-300 hover:border-electric-blue hover:shadow-[0_8px_32px_rgba(0,217,255,0.15)]">
        <h2 className="text-2xl font-bold text-white mb-2">Two-Factor Authentication</h2>
        <p className="text-text-secondary mb-8">
          Enter the 6-digit code from your Google Authenticator app
        </p>

        {/* Error Message */}
        {error && (
          <div className="bg-[#FF6B35]/10 border border-[#FF6B35]/30 rounded-lg p-3 mb-4">
            <p className="text-[#FF6B35] text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Verification Code
            </label>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                setCode(value)
              }}
              placeholder="000000"
              className="text-center text-2xl tracking-widest font-mono"
              required
              autoFocus
            />
            <p className="text-xs text-text-secondary mt-2 text-center">
              Open Google Authenticator and enter the 6-digit code
            </p>
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            className="w-full py-3.5 text-base"
            isLoading={isLoading}
            disabled={code.length !== 6}
          >
            Verify & Continue
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-bg-tertiary text-center">
          <p className="text-text-secondary text-sm">
            Lost access to your authenticator?{' '}
            <a 
              href="/support" 
              className="text-electric-blue hover:text-neon-orange transition-colors"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </AuthLayout>
  )
}

export default function Verify2FAPage() {
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
      <Verify2FAForm />
    </Suspense>
  )
}

