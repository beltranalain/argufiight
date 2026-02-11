'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/components/ui/Toast'
import { fetchClient } from '@/lib/api/fetchClient'
import { TwoFactorSettings } from '@/components/settings/TwoFactorSettings'

export default function SettingsPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    emailNotifications: true,
    debateNotifications: true,
  })

  const saveMutation = useMutation({
    mutationFn: (data: { currentPassword?: string; newPassword?: string; emailNotifications: boolean; debateNotifications: boolean }) =>
      fetchClient('/api/settings', { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      showToast({ type: 'success', title: 'Settings Updated', description: 'Your settings have been saved' })
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))
    },
    onError: (error: any) => {
      showToast({ type: 'error', title: 'Save Failed', description: error.message || 'Failed to update settings' })
    },
  })

  const handleSave = () => {
    if (formData.newPassword) {
      if (formData.newPassword.length < 6) {
        showToast({ type: 'error', title: 'Invalid Password', description: 'Password must be at least 6 characters' })
        return
      }
      if (formData.newPassword !== formData.confirmPassword) {
        showToast({ type: 'error', title: 'Password Mismatch', description: 'New password and confirmation do not match' })
        return
      }
      if (!formData.currentPassword) {
        showToast({ type: 'error', title: 'Current Password Required', description: 'Please enter your current password to change it' })
        return
      }
    }

    saveMutation.mutate({
      ...(formData.newPassword && { currentPassword: formData.currentPassword, newPassword: formData.newPassword }),
      emailNotifications: formData.emailNotifications,
      debateNotifications: formData.debateNotifications,
    })
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
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-text-secondary cursor-not-allowed"
                />
                <p className="text-xs text-text-muted mt-1">Email cannot be changed</p>
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
              <TwoFactorSettings />
            </CardBody>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-text-primary">Notifications</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                  <div>
                    <p className="font-semibold text-text-primary">Email Notifications</p>
                    <p className="text-sm text-text-secondary">Receive email updates about your debates</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.emailNotifications}
                      onChange={(e) => setFormData({ ...formData, emailNotifications: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-bg-secondary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-electric-blue" />
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                  <div>
                    <p className="font-semibold text-text-primary">Debate Notifications</p>
                    <p className="text-sm text-text-secondary">Get notified when it&apos;s your turn to argue</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.debateNotifications}
                      onChange={(e) => setFormData({ ...formData, debateNotifications: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-bg-secondary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-electric-blue" />
                  </label>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button variant="primary" onClick={handleSave} isLoading={saveMutation.isPending}>
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
