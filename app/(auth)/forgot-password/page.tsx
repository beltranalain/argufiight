'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email')
      }

      setSuccess(true)
    } catch (err: any) {
      console.error('Forgot password error:', err)
      setError(err.message || 'Failed to send reset email')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="bg-bg-secondary border border-bg-tertiary rounded-2xl p-10 relative group transition-all duration-300 hover:border-electric-blue hover:shadow-[0_8px_32px_rgba(0,217,255,0.15)]">
        {/* Gradient border on hover */}
        <div className="absolute inset-[-1px] bg-gradient-to-r from-electric-blue to-neon-orange rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300 -z-10" />

        <h2 className="text-2xl font-bold text-white mb-2">Forgot Password</h2>
        <p className="text-text-secondary text-sm mb-8">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {/* Success Message */}
        {success && (
          <div className="bg-[#00FF94]/10 border border-[#00FF94]/30 rounded-lg p-4 mb-4">
            <p className="text-[#00FF94] text-sm">
              If an account with that email exists, a password reset link has been sent.
            </p>
            <p className="text-text-secondary text-xs mt-2">
              Check your email for the reset link. In development, check the server console for the reset token.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-[#FF6B35]/10 border border-[#FF6B35]/30 rounded-lg p-3 mb-4">
            <p className="text-[#FF6B35] text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="email"
              label="Email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Button 
              type="submit" 
              variant="primary" 
              className="w-full py-3.5 text-base"
              isLoading={isLoading}
            >
              Send Reset Link
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <Button 
              onClick={() => {
                setSuccess(false)
                setEmail('')
              }}
              variant="secondary" 
              className="w-full py-3.5 text-base"
            >
              Send Another Email
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-bg-tertiary text-center">
          <Link 
            href="/login" 
            className="text-electric-blue text-sm hover:text-neon-orange transition-colors"
          >
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}

