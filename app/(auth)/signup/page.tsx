'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { isValidEmail, isValidPassword, isValidUsername, isBlockedUsername } from '@/lib/utils/validation'

export default function SignupPage() {
  const router = useRouter()
  
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const getPasswordStrength = (pwd: string) => {
    let strength = 0
    if (pwd.length >= 8) strength++
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++
    if (/[0-9]/.test(pwd)) strength++
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++
    return strength
  }

  const strength = getPasswordStrength(password)
  const strengthText = ['', 'Weak password', 'Fair password', 'Good password', 'Strong password'][strength]

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setErrors({})

    // Validation
    const newErrors: Record<string, string> = {}
    
    // Check for blocked usernames
    if (isBlockedUsername(username)) {
      newErrors.username = 'This username is reserved and cannot be used'
    } else if (!isValidUsername(username)) {
      newErrors.username = 'Username must be 3-20 characters and contain only letters, numbers, underscores, and hyphens'
    }

    if (!isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!isValidPassword(password)) {
      newErrors.password = 'Password must be at least 8 characters and contain at least one letter and one number'
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy')
      return
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Check if user was added to waiting list
        if (data.waitingList && response.status === 403) {
          setError(
            `✅ You've been added to the waiting list! Your position: #${data.position}. ${data.message || 'We will notify you when a spot becomes available.'}`
          )
          // Don't redirect, show success message
          return
        }
        // Show detailed error if available
        const errorMsg = data.details ? `${data.error}: ${data.details}` : (data.error || 'Failed to create account')
        throw new Error(errorMsg)
      }

      // FREE subscription is created automatically on the server
      // Wait a moment for session cookie to be set, then redirect to onboarding
      setTimeout(() => {
        window.location.href = '/onboarding'
      }, 100)
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="bg-bg-secondary border border-bg-tertiary rounded-2xl p-10 relative group transition-all duration-300 hover:border-electric-blue hover:shadow-[0_8px_32px_rgba(0,217,255,0.15)]">
        <div className="absolute inset-[-1px] bg-gradient-to-r from-electric-blue to-neon-orange rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300 -z-10" />

        <h2 className="text-2xl font-bold text-white mb-8">Create Account</h2>

        {error && (
          <div className={`rounded-lg p-3 mb-4 ${
            error.includes('✅') || error.includes('waiting list')
              ? 'bg-[#00FF94]/10 border border-[#00FF94]/30'
              : 'bg-[#FF6B35]/10 border border-[#FF6B35]/30'
          }`}>
            <p className={`text-sm ${
              error.includes('✅') || error.includes('waiting list')
                ? 'text-[#00FF94]'
                : 'text-[#FF6B35]'
            }`}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-5">
          <Input
            type="text"
            label="Username"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={errors.username}
            helpText="3-20 characters, letters, numbers, and underscores only"
            required
          />

          <Input
            type="email"
            label="Email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            required
          />

          <div>
            <Input
              type="password"
              label="Password"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              required
            />
            {password && (
              <div className="mt-2">
                <div className="flex gap-1.5 mb-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`flex-1 h-1 rounded-full transition-colors ${
                        i <= strength
                          ? strength <= 2
                            ? 'bg-neon-orange'
                            : strength === 3
                            ? 'bg-electric-blue'
                            : 'bg-cyber-green'
                          : 'bg-bg-tertiary'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-text-muted">{strengthText}</p>
              </div>
            )}
          </div>

          <Input
            type="password"
            label="Confirm Password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
            required
          />

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="w-5 h-5 mt-0.5 rounded border-2 border-bg-tertiary bg-bg-secondary checked:bg-gradient-to-r checked:from-electric-blue checked:to-neon-orange checked:border-electric-blue cursor-pointer"
            />
            <label htmlFor="terms" className="text-sm text-text-secondary cursor-pointer select-none">
              I agree to the{' '}
              <Link href="/terms" className="text-electric-blue hover:text-neon-orange hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-electric-blue hover:text-neon-orange hover:underline">
                Privacy Policy
              </Link>
            </label>
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            className="w-full py-3.5 text-base mt-2"
            isLoading={isLoading}
          >
            Create Account
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-bg-tertiary text-center">
          <p className="text-text-secondary text-sm">
            Already have an account?{' '}
            <Link 
              href="/login" 
              className="text-electric-blue font-medium hover:text-neon-orange hover:underline transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  )
}

