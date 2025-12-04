'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
  const router = useRouter()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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

