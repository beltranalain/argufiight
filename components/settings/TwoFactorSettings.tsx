'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { fetchClient } from '@/lib/api/fetchClient'

export function TwoFactorSettings() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [show2FADisable, setShow2FADisable] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [disablePassword, setDisablePassword] = useState('')

  const { data: twoFactorEnabled = false } = useQuery({
    queryKey: ['2fa-status'],
    queryFn: async () => {
      const data = await fetchClient<{ enabled: boolean }>('/api/auth/2fa/status')
      return data.enabled
    },
    staleTime: 60_000,
  })

  const setupMutation = useMutation({
    mutationFn: () => fetchClient<{ qrCode: string; backupCodes: string[] }>('/api/auth/2fa/setup'),
    onSuccess: (data) => {
      setQrCode(data.qrCode)
      setShow2FASetup(true)
    },
    onError: (error: any) => {
      showToast({ type: 'error', title: 'Setup Failed', description: error.message || 'Failed to setup 2FA' })
    },
  })

  const verifyMutation = useMutation({
    mutationFn: (token: string) =>
      fetchClient('/api/auth/2fa/verify', { method: 'POST', body: JSON.stringify({ token }) }),
    onSuccess: () => {
      showToast({ type: 'success', title: '2FA Enabled', description: 'Two-factor authentication has been enabled.' })
      setShow2FASetup(false)
      setVerificationCode('')
      setQrCode(null)
      queryClient.invalidateQueries({ queryKey: ['2fa-status'] })
    },
    onError: (error: any) => {
      showToast({ type: 'error', title: 'Verification Failed', description: error.message || 'Invalid verification code' })
      setVerificationCode('')
    },
  })

  const disableMutation = useMutation({
    mutationFn: (password: string) =>
      fetchClient('/api/auth/2fa/disable', { method: 'POST', body: JSON.stringify({ password }) }),
    onSuccess: () => {
      showToast({ type: 'success', title: '2FA Disabled', description: 'Two-factor authentication has been disabled.' })
      setShow2FADisable(false)
      setDisablePassword('')
      queryClient.invalidateQueries({ queryKey: ['2fa-status'] })
    },
    onError: (error: any) => {
      showToast({ type: 'error', title: 'Disable Failed', description: error.message || 'Failed to disable 2FA' })
      setDisablePassword('')
    },
  })

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
        <div className="flex-1">
          <p className="font-semibold text-text-primary">Google Authenticator</p>
          <p className="text-sm text-text-secondary mt-1">
            {twoFactorEnabled
              ? "2FA is enabled. You'll need to enter a code from Google Authenticator when logging in."
              : 'Add an extra layer of security to your account with two-factor authentication.'}
          </p>
        </div>
        <div className="ml-4">
          {twoFactorEnabled ? (
            <Button variant="secondary" onClick={() => setShow2FADisable(true)}>
              Disable
            </Button>
          ) : (
            <Button variant="primary" onClick={() => setupMutation.mutate()} isLoading={setupMutation.isPending}>
              Enable
            </Button>
          )}
        </div>
      </div>

      {/* Setup Modal */}
      <Modal
        isOpen={show2FASetup}
        onClose={() => { setShow2FASetup(false); setQrCode(null); setVerificationCode('') }}
        title="Setup Two-Factor Authentication"
      >
        <div className="space-y-6">
          <div className="bg-bg-tertiary rounded-lg p-4">
            <h3 className="text-white font-semibold mb-2">Step 1: Download Google Authenticator</h3>
            <p className="text-text-secondary text-sm mb-4">
              If you don&apos;t have it already, download Google Authenticator from the App Store or Google Play.
            </p>
            <div className="flex gap-4">
              <a href="https://apps.apple.com/app/google-authenticator/id388497605" target="_blank" rel="noopener noreferrer" className="text-electric-blue hover:text-neon-orange text-sm">
                Download for iOS
              </a>
              <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="noopener noreferrer" className="text-electric-blue hover:text-neon-orange text-sm">
                Download for Android
              </a>
            </div>
          </div>

          {qrCode && (
            <div className="flex flex-col items-center">
              <h3 className="text-white font-semibold mb-4">Step 2: Scan QR Code</h3>
              <div className="bg-white p-4 rounded-lg">
                <img src={qrCode} alt="2FA QR Code" className="w-64 h-64" />
              </div>
            </div>
          )}

          <div>
            <h3 className="text-white font-semibold mb-4">Step 3: Verify Setup</h3>
            <Input
              label="Enter 6-digit code from Google Authenticator"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="text-center text-2xl tracking-widest font-mono"
            />
            <Button
              variant="primary"
              className="w-full mt-4"
              onClick={() => verifyMutation.mutate(verificationCode)}
              isLoading={verifyMutation.isPending}
              disabled={verificationCode.length !== 6}
            >
              Verify & Enable 2FA
            </Button>
          </div>
        </div>
      </Modal>

      {/* Disable Modal */}
      <Modal
        isOpen={show2FADisable}
        onClose={() => { setShow2FADisable(false); setDisablePassword('') }}
        title="Disable Two-Factor Authentication"
      >
        <div className="space-y-6">
          <p className="text-text-secondary">
            To disable 2FA, please enter your password to confirm this action.
          </p>
          <Input
            label="Password"
            type="password"
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
            placeholder="Enter your password"
          />
          <div className="flex gap-4">
            <Button variant="secondary" className="flex-1" onClick={() => { setShow2FADisable(false); setDisablePassword('') }}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => disableMutation.mutate(disablePassword)}
              isLoading={disableMutation.isPending}
              disabled={!disablePassword}
            >
              Disable 2FA
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
