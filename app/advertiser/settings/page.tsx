'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchClient } from '@/lib/api/fetchClient'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import { Modal } from '@/components/ui/Modal'
import { FinancialConnectionsModal } from '@/components/stripe/FinancialConnectionsModal'
import { StripeConnectModal } from '@/components/stripe/StripeConnectModal'

interface Advertiser {
  id: string
  companyName: string
  contactEmail: string
  contactName: string
  website: string
  industry: string
  businessEIN: string | null
  paymentReady: boolean
  stripeAccountId: string | null
}

export default function AdvertiserSettingsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [show2FADisable, setShow2FADisable] = useState(false)
  const [disablePassword, setDisablePassword] = useState('')
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    website: '',
    industry: '',
    businessEIN: '',
  })
  const [showFinancialConnections, setShowFinancialConnections] = useState(false)
  const [showStripeConnect, setShowStripeConnect] = useState(false)

  // --- Queries ---

  const settingsQuery = useQuery({
    queryKey: ['advertiser', 'settings'],
    queryFn: async () => {
      const res = await fetch('/api/advertiser/settings')
      if (res.status === 401) {
        router.push('/login?userType=advertiser')
        return null
      }
      if (!res.ok) throw new Error('Failed to load settings')
      const data = await res.json()
      return data.advertiser as Advertiser
    },
  })

  const twoFAQuery = useQuery({
    queryKey: ['auth', '2fa', 'status'],
    queryFn: () => fetchClient<{ enabled: boolean }>('/api/auth/2fa/status'),
  })

  // Initialize form when data loads
  const advertiser = settingsQuery.data ?? null
  if (advertiser && formData.companyName === '' && advertiser.companyName) {
    setFormData({
      companyName: advertiser.companyName || '',
      contactName: advertiser.contactName || '',
      website: advertiser.website || '',
      industry: advertiser.industry || '',
      businessEIN: advertiser.businessEIN || '',
    })
  }

  const twoFactorEnabled = twoFAQuery.data?.enabled ?? false

  // --- Mutations ---

  const saveMutation = useMutation({
    mutationFn: () =>
      fetchClient('/api/advertiser/settings', {
        method: 'PUT',
        body: JSON.stringify(formData),
      }),
    onSuccess: () => {
      showToast({ type: 'success', title: 'Settings Updated', description: 'Your business information has been updated.' })
      queryClient.invalidateQueries({ queryKey: ['advertiser', 'settings'] })
    },
    onError: (error: Error) => {
      showToast({ type: 'error', title: 'Update Failed', description: error.message || 'Failed to update settings' })
    },
  })

  const disable2FAMutation = useMutation({
    mutationFn: () =>
      fetchClient('/api/auth/2fa/disable', {
        method: 'POST',
        body: JSON.stringify({ password: disablePassword }),
      }),
    onSuccess: () => {
      showToast({ type: 'success', title: '2FA Disabled', description: 'Two-factor authentication has been disabled.' })
      queryClient.invalidateQueries({ queryKey: ['auth', '2fa', 'status'] })
      setShow2FADisable(false)
      setDisablePassword('')
    },
    onError: (error: Error) => {
      showToast({ type: 'error', title: 'Disable Failed', description: error.message || 'Failed to disable 2FA' })
    },
  })

  // --- Handlers ---

  const handleConnectStripe = () => {
    setShowStripeConnect(true)
  }

  const handleStripeConnectSuccess = async () => {
    try {
      const verifyData = await fetchClient<{ paymentReady: boolean; message?: string }>('/api/advertiser/stripe-verify', {
        method: 'POST',
      })

      if (verifyData.paymentReady) {
        showToast({
          type: 'success',
          title: 'Payment Account Connected!',
          description: 'Your payment account has been successfully connected and verified.',
        })
      } else {
        showToast({
          type: 'warning',
          title: 'Setup Incomplete',
          description: verifyData.message || 'Please complete all required steps in the Stripe form.',
        })
      }
    } catch {
      // Verification failed silently
    }

    queryClient.invalidateQueries({ queryKey: ['advertiser', 'settings'] })
  }

  const handleFinancialConnectionsSuccess = async () => {
    showToast({
      type: 'success',
      title: 'Bank Account Connected',
      description: 'Your bank account has been successfully connected.',
    })
    queryClient.invalidateQueries({ queryKey: ['advertiser', 'settings'] })
  }

  const handleDisable2FA = () => {
    if (!disablePassword) {
      showToast({ type: 'error', title: 'Password Required', description: 'Please enter your password to disable 2FA' })
      return
    }
    disable2FAMutation.mutate()
  }

  if (settingsQuery.isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="ADVERTISER" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (settingsQuery.isError) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="ADVERTISER" />
        <div className="pt-20 px-4 md:px-8 pb-8">
          <ErrorDisplay
            title="Failed to load settings"
            message="Could not load your account settings. Please try again."
            onRetry={() => settingsQuery.refetch()}
          />
        </div>
      </div>
    )
  }

  if (!advertiser) {
    return null
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="ADVERTISER" />
      <div className="pt-20 px-4 md:px-8 pb-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-text-primary">Account Settings</h1>

          {/* Business Information */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-text-primary">Business Information</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Company Name *
                  </label>
                  <Input
                    value={formData.companyName}
                    onChange={(e) => {
                      const value = e.target.value
                      setFormData(prev => ({ ...prev, companyName: value }))
                    }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Contact Name
                  </label>
                  <Input
                    value={formData.contactName}
                    onChange={(e) => {
                      const value = e.target.value
                      setFormData(prev => ({ ...prev, contactName: value }))
                    }}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Website *
                  </label>
                  <Input
                    type="url"
                    value={formData.website}
                    onChange={(e) => {
                      const value = e.target.value
                      setFormData(prev => ({ ...prev, website: value }))
                    }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Industry *
                  </label>
                  <select
                    value={formData.industry}
                    onChange={(e) => {
                      const value = e.target.value
                      setFormData(prev => ({ ...prev, industry: value }))
                    }}
                    className="w-full px-4 py-3.5 bg-bg-secondary border border-bg-tertiary rounded-lg text-text-primary"
                    required
                  >
                    <option value="">Select Industry</option>
                    <option value="TECH">Technology</option>
                    <option value="FINANCE">Finance</option>
                    <option value="HEALTHCARE">Healthcare</option>
                    <option value="EDUCATION">Education</option>
                    <option value="RETAIL">Retail</option>
                    <option value="ENTERTAINMENT">Entertainment</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Business EIN (Optional)
                  </label>
                  <Input
                    value={formData.businessEIN}
                    onChange={(e) => {
                      const value = e.target.value
                      setFormData(prev => ({ ...prev, businessEIN: value }))
                    }}
                    placeholder="12-3456789"
                  />
                </div>
                <Button
                  variant="primary"
                  onClick={() => saveMutation.mutate()}
                  isLoading={saveMutation.isPending}
                  className="w-full md:w-auto"
                >
                  Save Changes
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Payment & Banking */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-text-primary">Payment & Banking</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold text-text-primary mb-1">Payment Account</h3>
                      <p className="text-sm text-text-secondary mb-2">
                        {advertiser.paymentReady
                          ? 'Account connected. Stripe is processing your account. Payments will be enabled shortly.'
                          : 'Connect your payment account to receive payments'}
                      </p>
                      {advertiser.paymentReady && advertiser.stripeAccountId && (
                        <div className="mt-2">
                          <p className="text-xs text-text-secondary">
                            Stripe Account: <code className="bg-bg-tertiary px-1.5 py-0.5 rounded text-electric-blue">{advertiser.stripeAccountId}</code>
                          </p>
                          <a
                            href={`https://dashboard.stripe.com/test/connect/accounts/overview/${advertiser.stripeAccountId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-electric-blue hover:underline mt-1 inline-block"
                          >
                            View in Stripe Dashboard
                          </a>
                        </div>
                      )}
                    </div>
                    <Button
                      variant={advertiser.paymentReady ? 'secondary' : 'primary'}
                      onClick={handleConnectStripe}
                    >
                      {advertiser.paymentReady ? 'Manage Account' : 'Connect Account'}
                    </Button>
                  </div>
              </div>
            </CardBody>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-text-primary">Security</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg">
                  <div>
                    <h3 className="font-semibold text-text-primary mb-1">Two-Factor Authentication</h3>
                    <p className="text-sm text-text-secondary">
                      {twoFactorEnabled
                        ? '2FA is enabled for your account'
                        : 'Add an extra layer of security to your account'}
                    </p>
                  </div>
                  {twoFactorEnabled ? (
                    <Button
                      variant="secondary"
                      onClick={() => setShow2FADisable(true)}
                    >
                      Disable 2FA
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={() => router.push('/setup-2fa')}
                    >
                      Enable 2FA
                    </Button>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Disable 2FA Modal */}
      <Modal
        isOpen={show2FADisable}
        onClose={() => {
          setShow2FADisable(false)
          setDisablePassword('')
        }}
        title="Disable Two-Factor Authentication"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Enter your password to disable two-factor authentication.
          </p>
          <Input
            type="password"
            label="Password"
            value={disablePassword}
            onChange={(e) => {
              const value = e.target.value
              setDisablePassword(value)
            }}
            placeholder="Enter your password"
          />
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setShow2FADisable(false)
                setDisablePassword('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDisable2FA}
              isLoading={disable2FAMutation.isPending}
            >
              Disable 2FA
            </Button>
          </div>
        </div>
      </Modal>

      {/* Stripe Connect Embedded Modal */}
      <StripeConnectModal
        isOpen={showStripeConnect}
        onClose={() => setShowStripeConnect(false)}
        onSuccess={handleStripeConnectSuccess}
        apiEndpoint="/api/advertiser/stripe-connect-embedded"
      />

      {/* Financial Connections Modal */}
      <FinancialConnectionsModal
        isOpen={showFinancialConnections}
        onClose={() => setShowFinancialConnections(false)}
        onSuccess={handleFinancialConnectionsSuccess}
        apiEndpoint="/api/advertiser/financial-connections"
        permissions={['payment_method', 'balances']}
      />
    </div>
  )
}
