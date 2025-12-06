'use client'

import { useState, useEffect } from 'react'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/components/ui/Toast'

export default function SettingsPage() {
  const { user, refetch } = useAuth()
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [twoFactorLoading, setTwoFactorLoading] = useState(false)
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [show2FADisable, setShow2FADisable] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [verificationCode, setVerificationCode] = useState('')
  const [disablePassword, setDisablePassword] = useState('')
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    emailNotifications: true,
    debateNotifications: true,
  })

  // Fetch 2FA status on mount
  useEffect(() => {
    fetch2FAStatus()
  }, [])

  const fetch2FAStatus = async () => {
    try {
      const response = await fetch('/api/auth/2fa/status')
      if (response.ok) {
        const data = await response.json()
        setTwoFactorEnabled(data.enabled || false)
      }
    } catch (error) {
      console.error('Failed to fetch 2FA status:', error)
    }
  }

  const handleSetup2FA = async () => {
    setTwoFactorLoading(true)
    try {
      const response = await fetch('/api/auth/2fa/setup')
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to setup 2FA')
      }

      const data = await response.json()
      setQrCode(data.qrCode)
      setBackupCodes(data.backupCodes)
      setShow2FASetup(true)
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Setup Failed',
        description: error.message || 'Failed to setup 2FA',
      })
    } finally {
      setTwoFactorLoading(false)
    }
  }

  const handleVerify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      showToast({
        type: 'error',
        title: 'Invalid Code',
        description: 'Please enter a 6-digit code',
      })
      return
    }

    setTwoFactorLoading(true)
    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationCode }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Invalid verification code')
      }

      showToast({
        type: 'success',
        title: '2FA Enabled',
        description: 'Two-factor authentication has been enabled for your account.',
      })

      setShow2FASetup(false)
      setVerificationCode('')
      setQrCode(null)
      await fetch2FAStatus()
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Verification Failed',
        description: error.message || 'Invalid verification code',
      })
      setVerificationCode('')
    } finally {
      setTwoFactorLoading(false)
    }
  }

  const handleDisable2FA = async () => {
    if (!disablePassword) {
      showToast({
        type: 'error',
        title: 'Password Required',
        description: 'Please enter your password to disable 2FA',
      })
      return
    }

    setTwoFactorLoading(true)
    try {
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: disablePassword }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to disable 2FA')
      }

      showToast({
        type: 'success',
        title: '2FA Disabled',
        description: 'Two-factor authentication has been disabled for your account.',
      })

      setShow2FADisable(false)
      setDisablePassword('')
      await fetch2FAStatus()
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Disable Failed',
        description: error.message || 'Failed to disable 2FA',
      })
      setDisablePassword('')
    } finally {
      setTwoFactorLoading(false)
    }
  }

  const handleSave = async () => {
    // Validate passwords if changing
    if (formData.newPassword) {
      if (formData.newPassword.length < 6) {
        showToast({
          type: 'error',
          title: 'Invalid Password',
          description: 'Password must be at least 6 characters',
        })
        return
      }

      if (formData.newPassword !== formData.confirmPassword) {
        showToast({
          type: 'error',
          title: 'Password Mismatch',
          description: 'New password and confirmation do not match',
        })
        return
      }

      if (!formData.currentPassword) {
        showToast({
          type: 'error',
          title: 'Current Password Required',
          description: 'Please enter your current password to change it',
        })
        return
      }
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(formData.newPassword && {
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword,
          }),
          emailNotifications: formData.emailNotifications,
          debateNotifications: formData.debateNotifications,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update settings')
      }

      showToast({
        type: 'success',
        title: 'Settings Updated',
        description: 'Your settings have been saved',
      })

      // Clear password fields
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Save Failed',
        description: error.message || 'Failed to update settings',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="SETTINGS" />
      
      <div className="pt-24 px-4 md:px-8 pb-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Account Settings */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-text-primary">Account Settings</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-text-secondary cursor-not-allowed"
                  />
                  <p className="text-xs text-text-muted mt-1">Email cannot be changed</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-text-primary">Change Password</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-6">
                <Input
                  label="Current Password"
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                />
                <Input
                  label="New Password"
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  placeholder="Enter new password"
                  helpText="Minimum 6 characters"
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                />
              </div>
            </CardBody>
          </Card>

          {/* Two-Factor Authentication */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-text-primary">Two-Factor Authentication</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold text-text-primary">Google Authenticator</p>
                    <p className="text-sm text-text-secondary mt-1">
                      {twoFactorEnabled 
                        ? '2FA is enabled. You\'ll need to enter a code from Google Authenticator when logging in.'
                        : 'Add an extra layer of security to your account with two-factor authentication.'}
                    </p>
                  </div>
                  <div className="ml-4">
                    {twoFactorEnabled ? (
                      <Button
                        variant="secondary"
                        onClick={() => setShow2FADisable(true)}
                        disabled={twoFactorLoading}
                      >
                        Disable
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        onClick={handleSetup2FA}
                        isLoading={twoFactorLoading}
                      >
                        Enable
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-text-primary">Notifications</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                  <div>
                    <p className="font-semibold text-text-primary">Email Notifications</p>
                    <p className="text-sm text-text-secondary">
                      Receive email updates about your debates
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.emailNotifications}
                      onChange={(e) => setFormData({ ...formData, emailNotifications: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-bg-secondary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-electric-blue"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                  <div>
                    <p className="font-semibold text-text-primary">Debate Notifications</p>
                    <p className="text-sm text-text-secondary">
                      Get notified when it's your turn to argue
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.debateNotifications}
                      onChange={(e) => setFormData({ ...formData, debateNotifications: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-bg-secondary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-electric-blue"></div>
                  </label>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={handleSave}
              isLoading={isSaving}
            >
              Save Settings
            </Button>
          </div>
        </div>
      </div>

      {/* 2FA Setup Modal */}
      <Modal
        isOpen={show2FASetup}
        onClose={() => {
          setShow2FASetup(false)
          setQrCode(null)
          setBackupCodes([])
          setVerificationCode('')
        }}
        title="Setup Two-Factor Authentication"
      >
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
            </div>
          )}

          {/* Verification Code Input */}
          <div>
            <h3 className="text-white font-semibold mb-4">Step 3: Verify Setup</h3>
            <Input
              label="Enter 6-digit code from Google Authenticator"
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
            />
            <Button
              variant="primary"
              className="w-full mt-4"
              onClick={handleVerify2FA}
              isLoading={twoFactorLoading}
              disabled={verificationCode.length !== 6}
            >
              Verify & Enable 2FA
            </Button>
          </div>
        </div>
      </Modal>

      {/* 2FA Disable Modal */}
      <Modal
        isOpen={show2FADisable}
        onClose={() => {
          setShow2FADisable(false)
          setDisablePassword('')
        }}
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
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShow2FADisable(false)
                setDisablePassword('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleDisable2FA}
              isLoading={twoFactorLoading}
              disabled={!disablePassword}
            >
              Disable 2FA
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

