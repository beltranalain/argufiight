'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { LoadingSpinner } from '@/components/ui/Loading'

export default function AdminSettingsPage() {
  const { showToast } = useToast()
  const [deepseekKey, setDeepseekKey] = useState('')
  const [resendKey, setResendKey] = useState('')
  const [googleAnalyticsKey, setGoogleAnalyticsKey] = useState('')
  const [googleAnalyticsPropertyId, setGoogleAnalyticsPropertyId] = useState('')
  const [stripePublishableKey, setStripePublishableKey] = useState('')
  const [stripeSecretKey, setStripeSecretKey] = useState('')
  const [tournamentsEnabled, setTournamentsEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [isTesting, setIsTesting] = useState(false)
  const [isTestingResend, setIsTestingResend] = useState(false)
  const [isTestingGoogle, setIsTestingGoogle] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)
  const [testGoogleResult, setTestGoogleResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)
  const [testResendResult, setTestResendResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        setDeepseekKey(data.DEEPSEEK_API_KEY || '')
        setResendKey(data.RESEND_API_KEY || '')
        setGoogleAnalyticsKey(data.GOOGLE_ANALYTICS_API_KEY || '')
        setGoogleAnalyticsPropertyId(data.GOOGLE_ANALYTICS_PROPERTY_ID || '')
        setStripePublishableKey(data.STRIPE_PUBLISHABLE_KEY || '')
        setStripeSecretKey(data.STRIPE_SECRET_KEY || '')
        setTournamentsEnabled(data.TOURNAMENTS_ENABLED === 'true')
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setIsFetching(false)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          DEEPSEEK_API_KEY: deepseekKey,
          RESEND_API_KEY: resendKey,
          GOOGLE_ANALYTICS_API_KEY: googleAnalyticsKey,
          GOOGLE_ANALYTICS_PROPERTY_ID: googleAnalyticsPropertyId,
          STRIPE_PUBLISHABLE_KEY: stripePublishableKey,
          STRIPE_SECRET_KEY: stripeSecretKey,
          TOURNAMENTS_ENABLED: tournamentsEnabled.toString(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save settings')
      }

      showToast({
        type: 'success',
        title: 'Settings Saved',
        description: 'API keys have been updated',
      })
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Save Failed',
        description: error.message || 'Please try again',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestDeepSeek = async () => {
    setIsTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/admin/settings/test-deepseek', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        setTestResult({
          success: true,
          message: `✅ Connection successful! Response: "${data.response}" (${data.tokensUsed} tokens used)`,
        })
        showToast({
          type: 'success',
          title: 'API Test Successful',
          description: 'DeepSeek API is working correctly',
        })
      } else {
        setTestResult({
          success: false,
          error: data.error || 'Connection failed',
        })
        showToast({
          type: 'error',
          title: 'API Test Failed',
          description: data.error || 'Please check your API key',
        })
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        error: error.message || 'Failed to test connection',
      })
      showToast({
        type: 'error',
        title: 'Test Failed',
        description: 'Could not connect to DeepSeek API',
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleTestResend = async () => {
    setIsTestingResend(true)
    setTestResendResult(null)

    try {
      const response = await fetch('/api/admin/settings/test-resend', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        setTestResendResult({
          success: true,
          message: `✅ Connection successful! Found ${data.apiKeysFound || 0} API keys`,
        })
        showToast({
          type: 'success',
          title: 'API Test Successful',
          description: 'Resend API is working correctly',
        })
      } else {
        setTestResendResult({
          success: false,
          error: data.error || 'Connection failed',
        })
        showToast({
          type: 'error',
          title: 'API Test Failed',
          description: data.error || 'Please check your API key',
        })
      }
    } catch (error: any) {
      setTestResendResult({
        success: false,
        error: error.message || 'Failed to test connection',
      })
      showToast({
        type: 'error',
        title: 'Test Failed',
        description: 'Could not connect to Resend API',
      })
      } finally {
        setIsTestingResend(false)
      }
    }

  const handleTestGoogleAnalytics = async () => {
    setIsTestingGoogle(true)
    setTestGoogleResult(null)

    try {
      // First save the current values
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          GOOGLE_ANALYTICS_API_KEY: googleAnalyticsKey,
          GOOGLE_ANALYTICS_PROPERTY_ID: googleAnalyticsPropertyId,
        }),
      })

      const response = await fetch('/api/admin/settings/test-google-analytics', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        setTestGoogleResult({
          success: true,
          message: data.message || '✅ Connection successful!',
        })
        showToast({
          type: 'success',
          title: 'Google Analytics Connected',
          description: `Successfully connected to Property ${data.propertyId}`,
        })
      } else {
        setTestGoogleResult({
          success: false,
          error: data.error || 'Connection failed',
        })
        showToast({
          type: 'error',
          title: 'Connection Failed',
          description: data.error || 'Please check your credentials',
        })
      }
    } catch (error: any) {
      setTestGoogleResult({
        success: false,
        error: error.message || 'Failed to test connection',
      })
      showToast({
        type: 'error',
        title: 'Test Failed',
        description: 'Could not connect to Google Analytics',
      })
    } finally {
      setIsTestingGoogle(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
      <p className="text-text-secondary mb-8">Configure platform settings and API keys</p>

      <div className="max-w-2xl space-y-6">
        {/* API Keys Section */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-white">API Keys</h2>
            <p className="text-sm text-text-secondary mt-1">
              Configure external service API keys. These are stored securely in the database.
            </p>
          </CardHeader>
          <CardBody className="space-y-6">
            {/* DeepSeek API Key */}
            <div>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-white mb-2">
                    DeepSeek API Key
                  </label>
                  <input
                    type="password"
                    value={deepseekKey}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeepseekKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
                  />
                  <p className="text-xs text-text-secondary mt-1">Required for AI judge verdicts</p>
                </div>
                <Button
                  variant="secondary"
                  onClick={handleTestDeepSeek}
                  isLoading={isTesting}
                >
                  {isTesting ? 'Testing...' : 'Test Connection'}
                </Button>
              </div>
              {testResult && (
                <div className={`mt-2 p-3 rounded-lg border ${
                  testResult.success
                    ? 'bg-cyber-green/10 border-cyber-green/30'
                    : 'bg-neon-orange/10 border-neon-orange/30'
                }`}>
                  <p className={`text-sm ${
                    testResult.success ? 'text-cyber-green' : 'text-neon-orange'
                  }`}>
                    {testResult.success ? testResult.message : testResult.error}
                  </p>
                </div>
              )}
              <div className="mt-2 p-3 bg-electric-blue/10 border border-electric-blue/30 rounded-lg">
                <p className="text-sm text-electric-blue">
                  <strong>Get your API key:</strong> Visit{' '}
                  <a
                    href="https://platform.deepseek.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-neon-orange"
                  >
                    platform.deepseek.com
                  </a>
                </p>
              </div>
            </div>

            {/* Resend API Key */}
            <div>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-white mb-2">
                    Resend API Key
                  </label>
                  <input
                    type="password"
                    value={resendKey}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setResendKey(e.target.value)}
                    placeholder="re_..."
                    className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
                  />
                  <p className="text-xs text-text-secondary mt-1">Optional for email notifications</p>
                </div>
                <Button
                  variant="secondary"
                  onClick={handleTestResend}
                  isLoading={isTestingResend}
                >
                  {isTestingResend ? 'Testing...' : 'Test Connection'}
                </Button>
              </div>
              {testResendResult && (
                <div className={`mt-2 p-3 rounded-lg border ${
                  testResendResult.success
                    ? 'bg-cyber-green/10 border-cyber-green/30'
                    : 'bg-neon-orange/10 border-neon-orange/30'
                }`}>
                  <p className={`text-sm ${
                    testResendResult.success ? 'text-cyber-green' : 'text-neon-orange'
                  }`}>
                    {testResendResult.success ? testResendResult.message : testResendResult.error}
                  </p>
                </div>
              )}
              <div className="mt-2 p-3 bg-text-muted/10 border border-text-muted/30 rounded-lg">
                <p className="text-sm text-text-secondary">
                  <strong>Get your API key:</strong> Visit{' '}
                  <a
                    href="https://resend.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-electric-blue"
                  >
                    resend.com
                  </a>
                </p>
              </div>
            </div>

            {/* Google Analytics */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Google Analytics Property ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={googleAnalyticsPropertyId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGoogleAnalyticsPropertyId(e.target.value)}
                    placeholder="123456789"
                    className="flex-1 px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
                  />
                  <Button
                    variant="secondary"
                    onClick={handleTestGoogleAnalytics}
                    isLoading={isTestingGoogle}
                    disabled={!googleAnalyticsPropertyId || !googleAnalyticsKey}
                  >
                    Test Connection
                  </Button>
                </div>
                <p className="text-xs text-text-secondary mt-1">GA4 Property ID (found in Admin → Property Settings)</p>
                {testGoogleResult && (
                  <div className={`mt-2 p-2 rounded text-xs ${
                    testGoogleResult.success 
                      ? 'bg-cyber-green/20 text-cyber-green border border-cyber-green/30' 
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {testGoogleResult.success ? testGoogleResult.message : testGoogleResult.error}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Google Analytics Service Account JSON
                </label>
                <textarea
                  value={googleAnalyticsKey}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    setGoogleAnalyticsKey(e.target.value)
                    setTestGoogleResult(null) // Clear test result when editing
                  }}
                  placeholder='{"type": "service_account", "project_id": "...", ...}'
                  rows={4}
                  className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent font-mono text-sm"
                />
                <p className="text-xs text-text-secondary mt-1">
                  Service account JSON credentials from Google Cloud Console (NOT the gtag.js script)
                </p>
                {googleAnalyticsKey && googleAnalyticsKey.includes('gtag') && (
                  <div className="mt-2 p-2 rounded text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                    ⚠️ Warning: It looks like you pasted the gtag.js script. You need the Service Account JSON file from Google Cloud Console, which starts with {"type": "service_account", ...}
                  </div>
                )}
              </div>
              <div className="p-3 bg-text-muted/10 border border-text-muted/30 rounded-lg">
                <p className="text-sm text-text-secondary">
                  <strong>Setup Instructions:</strong>
                </p>
                <ol className="text-xs text-text-secondary mt-2 space-y-1 list-decimal list-inside">
                  <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-electric-blue">Google Cloud Console</a></li>
                  <li>Create a project or select existing one</li>
                  <li>Enable "Google Analytics Data API"</li>
                  <li>Create a Service Account and download JSON key</li>
                  <li>Add service account email to GA4 property with "Viewer" role</li>
                  <li>Paste JSON credentials and Property ID above</li>
                </ol>
              </div>
            </div>

            {/* Stripe Payment Keys */}
            <div className="space-y-4 pt-4 border-t border-bg-tertiary">
              <h3 className="text-lg font-semibold text-white mb-4">Stripe Payment Configuration</h3>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Stripe Publishable Key
                </label>
                <input
                  type="text"
                  value={stripePublishableKey}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStripePublishableKey(e.target.value)}
                  placeholder="pk_test_..."
                  className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
                />
                <p className="text-xs text-text-secondary mt-1">Public key for client-side Stripe integration</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Stripe Secret Key
                </label>
                <input
                  type="password"
                  value={stripeSecretKey}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStripeSecretKey(e.target.value)}
                  placeholder="sk_test_..."
                  className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
                />
                <p className="text-xs text-text-secondary mt-1">Secret key for server-side Stripe operations (stored encrypted)</p>
              </div>
              <div className="p-3 bg-electric-blue/10 border border-electric-blue/30 rounded-lg">
                <p className="text-sm text-electric-blue mb-2">
                  <strong>Important:</strong> Processing fees will be passed to users
                </p>
                <p className="text-xs text-text-secondary">
                  When charging $1/month for tournaments, Stripe processing fees (~$0.32 + 2.9%) will be added to the user's charge.
                  This ensures Argu Fight receives the full $1.00. Users will pay approximately $1.35/month.
                </p>
              </div>
              <div className="p-3 bg-text-muted/10 border border-text-muted/30 rounded-lg">
                <p className="text-sm text-text-secondary">
                  <strong>Get your Stripe keys:</strong> Visit{' '}
                  <a
                    href="https://dashboard.stripe.com/apikeys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-electric-blue"
                  >
                    dashboard.stripe.com/apikeys
                  </a>
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <Button
                variant="primary"
                onClick={handleSave}
                isLoading={isLoading}
              >
                Save Settings
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Platform Settings */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-white">Platform Settings</h2>
            <p className="text-sm text-text-secondary mt-1">
              Control platform-wide features and behavior
            </p>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
              <div>
                <p className="font-semibold text-white">Maintenance Mode</p>
                <p className="text-sm text-text-secondary">
                  Disable all debates and show maintenance message
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-bg-secondary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-electric-blue"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
              <div>
                <p className="font-semibold text-white">Allow New Signups</p>
                <p className="text-sm text-text-secondary">
                  Enable or disable new user registrations
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-bg-secondary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-electric-blue"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
              <div>
                <p className="font-semibold text-white">Tournaments Feature</p>
                <p className="text-sm text-text-secondary">
                  Enable tournament creation and participation
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={tournamentsEnabled}
                  onChange={(e) => setTournamentsEnabled(e.target.checked)}
                />
                <div className={`w-11 h-6 rounded-full peer transition-colors ${
                  tournamentsEnabled ? 'bg-electric-blue' : 'bg-bg-secondary'
                } peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${
                  tournamentsEnabled ? 'after:translate-x-5' : 'after:translate-x-0'
                }`}></div>
              </label>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

