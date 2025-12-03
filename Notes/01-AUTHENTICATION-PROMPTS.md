# CURSOR.AI PROMPTS - AUTHENTICATION

Use these prompts to implement authentication in the exact order listed.

---

## PROMPT 1: UI Components (Button & Input)

```
Create reusable UI components matching the design system:

File: components/ui/Button.tsx

import React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  isLoading?: boolean
}

export function Button({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className,
  disabled,
  ...props 
}: ButtonProps) {
  const baseStyles = 'font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-gradient-to-r from-electric-blue to-neon-orange text-black hover:shadow-[0_8px_24px_rgba(0,217,255,0.4)] hover:-translate-y-0.5',
    secondary: 'bg-transparent border-2 border-electric-blue text-electric-blue hover:bg-electric-blue hover:text-black',
    ghost: 'bg-transparent text-text-secondary hover:text-white hover:bg-bg-tertiary'
  }

  return (
    <button
      className={cn(baseStyles, variants[variant], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          {children}
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </span>
      ) : (
        children
      )}
    </button>
  )
}

---

File: components/ui/Input.tsx

import React from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helpText?: string
}

export function Input({ 
  label, 
  error, 
  helpText,
  className,
  ...props 
}: InputProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <input
        className={cn(
          'bg-bg-secondary border border-bg-tertiary rounded-lg px-4 py-3.5 text-white',
          'transition-all duration-300 outline-none',
          'focus:border-electric-blue focus:shadow-[0_0_0_3px_rgba(0,217,255,0.1)]',
          'placeholder:text-text-muted',
          error && 'border-neon-orange',
          className
        )}
        {...props}
      />
      {error && (
        <span className="text-sm text-neon-orange">{error}</span>
      )}
      {helpText && !error && (
        <span className="text-sm text-text-muted">{helpText}</span>
      )}
    </div>
  )
}

---

File: lib/utils.ts

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

Install: npm install clsx tailwind-merge
```

---

## PROMPT 2: Auth Layout Component

```
Create the auth layout component matching html-templates/auth-login.html:

File: components/auth/AuthLayout.tsx

'use client'

import React from 'react'
import Link from 'next/link'

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-5">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] bg-electric-blue rounded-full opacity-15 blur-[80px] animate-pulse-glow" />
        <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] bg-neon-orange rounded-full opacity-15 blur-[80px] animate-pulse-glow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-hot-pink rounded-full opacity-15 blur-[80px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-[440px]">
        {/* Logo Section */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-electric-blue to-neon-orange flex items-center justify-center text-2xl">
              ⚖
            </div>
            <h1 className="text-[32px] font-bold bg-gradient-to-r from-electric-blue to-neon-orange bg-clip-text text-transparent">
              HONORABLE AI
            </h1>
          </Link>
          <p className="text-text-secondary text-sm">
            Where debates are judged by AI
          </p>
        </div>

        {/* Card */}
        {children}
      </div>
    </div>
  )
}
```

---

## PROMPT 3: Login Page

```
Create the login page matching html-templates/auth-login.html:

File: app/(auth)/login/page.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push('/')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) setError(error.message)
  }

  return (
    <AuthLayout>
      <div className="bg-bg-secondary border border-bg-tertiary rounded-2xl p-10 relative group transition-all duration-300 hover:border-electric-blue hover:shadow-[0_8px_32px_rgba(0,217,255,0.15)]">
        {/* Gradient border on hover */}
        <div className="absolute inset-[-1px] bg-gradient-to-r from-electric-blue to-neon-orange rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300 -z-10" />

        <h2 className="text-2xl font-bold text-white mb-8">Sign In</h2>

        {/* Error Message */}
        {error && (
          <div className="bg-neon-orange/10 border border-neon-orange/30 rounded-lg p-3 mb-4">
            <p className="text-neon-orange text-sm">{error}</p>
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

        {/* Divider */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-bg-tertiary" />
          <span className="text-text-muted text-sm">OR</span>
          <div className="flex-1 h-px bg-bg-tertiary" />
        </div>

        {/* Google Login */}
        <button
          onClick={handleGoogleLogin}
          className="w-full bg-transparent border-2 border-bg-tertiary text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-3 hover:border-electric-blue hover:bg-electric-blue/5 transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

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
```

---

## PROMPT 4: Signup Page

```
Create the signup page matching html-templates/auth-signup.html:

File: app/(auth)/signup/page.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'
import { validateEmail, validatePassword, validateUsername } from '@/lib/utils/validation'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  
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

    const usernameValidation = validateUsername(username)
    if (!usernameValidation.isValid) {
      newErrors.username = usernameValidation.error!
    }

    if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email'
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.errors[0]
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
      // Check if username exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single()

      if (existingUser) {
        throw new Error('Username already taken')
      }

      // Create account
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      })

      if (signUpError) throw signUpError

      router.push('/')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) setError(error.message)
  }

  return (
    <AuthLayout>
      <div className="bg-bg-secondary border border-bg-tertiary rounded-2xl p-10 relative group transition-all duration-300 hover:border-electric-blue hover:shadow-[0_8px_32px_rgba(0,217,255,0.15)]">
        <div className="absolute inset-[-1px] bg-gradient-to-r from-electric-blue to-neon-orange rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300 -z-10" />

        <h2 className="text-2xl font-bold text-white mb-8">Create Account</h2>

        {error && (
          <div className="bg-neon-orange/10 border border-neon-orange/30 rounded-lg p-3 mb-4">
            <p className="text-neon-orange text-sm">{error}</p>
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

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-bg-tertiary" />
          <span className="text-text-muted text-sm">OR</span>
          <div className="flex-1 h-px bg-bg-tertiary" />
        </div>

        <button
          onClick={handleGoogleSignup}
          className="w-full bg-transparent border-2 border-bg-tertiary text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-3 hover:border-electric-blue hover:bg-electric-blue/5 transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

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
```

---

## IMPLEMENTATION ORDER

1. Run Prompt 1 (UI Components)
2. Run Prompt 2 (Auth Layout)
3. Run Prompt 3 (Login Page)
4. Run Prompt 4 (Signup Page)

## TESTING

After implementing:
1. Go to http://localhost:3000/login
2. Verify it matches html-templates/auth-login.html
3. Go to http://localhost:3000/signup
4. Verify it matches html-templates/auth-signup.html
5. Test actual signup/login flow
6. Verify session persists on refresh

---

PART 2 COMPLETE - Authentication system ready!
