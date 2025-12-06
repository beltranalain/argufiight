'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'

function Setup2FAForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams.get('userId')
  
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [verificationCode, setVerificationCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    // Generate QR code on mount
    fetchSetup()
  }, [])

  const fetchSetup = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/auth/2fa/setup')
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to setup 2FA')
      }

      const data = await response.json()
      setQrCode(data.qrCode)
      setSecret(data.secret)
      setBackupCodes(data.backupCodes)
    } catch (err: any) {
      setError(err.message || 'Failed to setup 2FA')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsVerifying(true)

    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a 6-digit code')
      setIsVerifying(false)
      return
    }

    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationCode, userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invalid verification code')
      }

      // 2FA enabled successfully
      setShowBackupCodes(true)
      showToast({
        type: 'success',
        title: '2FA Enabled',
        description: 'Two-factor authentication has been enabled for your account.',
      })
    } catch (err: any) {
      console.error('2FA verification error:', err)
      setError(err.message || 'Invalid verification code')
      setVerificationCode('')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleContinue = () => {
    // Redirect to dashboard
    setTimeout(() => {
      fetch('/api/auth/me')
        .then(res => res.json())
        .then(userData => {
          if (userData.user?.isAdmin) {
            window.location.href = '/admin'
          } else {
            fetch('/api/advertiser/me')
              .then(advRes => advRes.json())
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
  }

  if (isLoading) {
    return (
      <AuthLayout>
        <div className="bg-bg-secondary border border-bg-tertiary rounded-2xl p-10">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-text-secondary">Setting up 2FA...</div>
          </div>
        </div>
      </AuthLayout>
    )
  }

  if (showBackupCodes) {
    return (
      <AuthLayout>
        <Card className="max-w-2xl">
          <CardHeader>
            <h2 className="text-2xl font-bold text-white">2FA Setup Complete</h2>
            <p className="text-text-secondary mt-2">
              Save these backup codes in a safe place. You can use them if you lose access to your authenticator.
            </p>
          </CardHeader>
          <CardBody>
            <div className="bg-bg-tertiary rounded-lg p-6 mb-6">
              <div className="grid grid-cols-2 gap-4">
                {backupCodes.map((code, index) => (
                  <div key={index} className="font-mono text-lg text-electric-blue text-center p-2 bg-bg-secondary rounded">
                    {code}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <p className="text-yellow-500 text-sm">
                ⚠️ <strong>Important:</strong> These codes can only be viewed once. Save them now!
              </p>
            </div>
            <Button
              variant="primary"
              className="w-full"
              onClick={handleContinue}
            >
              Continue to Dashboard
            </Button>
          </CardBody>
        </Card>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <Card className="max-w-2xl">
        <CardHeader>
          <h2 className="text-2xl font-bold text-white">Setup Two-Factor Authentication</h2>
          <p className="text-text-secondary mt-2">
            Scan the QR code with Google Authenticator to enable 2FA for your account
          </p>
        </CardHeader>
        <CardBody>
          <div className="space-y-6">
            {/* Instructions */}
            <div className="bg-bg-tertiary rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">Step 1: Download Google Authenticator</h3>
              <p className="text-text-secondary text-sm mb-4">
                If you don't have it already, download Google Authenticator from the App Store or Google Play.
              </p>
              <div className="flex gap-4">
                <a 
                  href="https://apps.apple.com/app/google-authenticator/id388497605" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-electric-blue hover:text-neon-orange text-sm"
                >
                  Download for iOS
                </a>
                <a 
                  href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-electric-blue hover:text-neon-orange text-sm"
                >
                  Download for Android
                </a>
              </div>
            </div>

            {/* QR Code */}
            {qrCode && (
              <div className="flex flex-col items-center">
                <h3 className="text-white font-semibold mb-4">Step 2: Scan QR Code</h3>
                <div className="bg-white p-4 rounded-lg">
                  <img src={qrCode} alt="2FA QR Code" className="w-64 h-64" />
                </div>
                {secret && (
                  <p className="text-xs text-text-secondary mt-4 text-center max-w-md">
                    Can't scan? Enter this code manually: <code className="bg-bg-tertiary px-2 py-1 rounded">{secret}</code>
                  </p>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-[#FF6B35]/10 border border-[#FF6B35]/30 rounded-lg p-3">
                <p className="text-[#FF6B35] text-sm">{error}</p>
              </div>
            )}

            {/* Verification Code Input */}
            <div>
              <h3 className="text-white font-semibold mb-4">Step 3: Verify Setup</h3>
              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Enter 6-digit code from Google Authenticator
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                      setVerificationCode(value)
                    }}
                    placeholder="000000"
                    className="text-center text-2xl tracking-widest font-mono"
                    required
                    autoFocus
                  />
                </div>
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="w-full"
                  isLoading={isVerifying}
                  disabled={verificationCode.length !== 6}
                >
                  Verify & Enable 2FA
                </Button>
              </form>
            </div>
          </div>
        </CardBody>
      </Card>
    </AuthLayout>
  )
}

export default function Setup2FAPage() {
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
      <Setup2FAForm />
    </Suspense>
  )
}

