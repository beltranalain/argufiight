'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { LoadingSpinner } from '@/components/ui/Loading'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

interface SEOSettings {
  siteTitle: string
  siteDescription: string
  defaultOgImage: string
  twitterCardType: string
  googleAnalyticsId: string
  googleSearchConsoleVerification: string
  canonicalUrlBase: string
  organizationName: string
  organizationLogo: string
  organizationDescription: string
  organizationContactInfo: string
  organizationSocialFacebook: string
  organizationSocialTwitter: string
  organizationSocialLinkedIn: string
  organizationSocialInstagram: string
  organizationSocialYouTube: string
}

export default function SettingsTab() {
  const { showToast } = useToast()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [gscClientId, setGscClientId] = useState('')
  const [gscClientSecret, setGscClientSecret] = useState('')
  const [gscSiteUrl, setGscSiteUrl] = useState('')
  const [gscConnected, setGscConnected] = useState(false)
  const [gscConnecting, setGscConnecting] = useState(false)
  const [gscSavingCreds, setGscSavingCreds] = useState(false)
  const [gscCredsSaved, setGscCredsSaved] = useState(false)
  const [gscTesting, setGscTesting] = useState(false)
  const [gscTestResult, setGscTestResult] = useState<{
    success: boolean
    error?: string
    configuredSiteUrl: string
    availableSites: Array<{ siteUrl: string; permissionLevel: string }>
    siteAccessible: boolean
  } | null>(null)
  const [settings, setSettings] = useState<SEOSettings>({
    siteTitle: '',
    siteDescription: '',
    defaultOgImage: '',
    twitterCardType: 'summary_large_image',
    googleAnalyticsId: '',
    googleSearchConsoleVerification: '',
    canonicalUrlBase: '',
    organizationName: '',
    organizationLogo: '',
    organizationDescription: '',
    organizationContactInfo: '',
    organizationSocialFacebook: '',
    organizationSocialTwitter: '',
    organizationSocialLinkedIn: '',
    organizationSocialInstagram: '',
    organizationSocialYouTube: '',
  })

  useEffect(() => {
    fetchSettings()
    checkGscStatus()
    // Show success toast if redirected back from OAuth
    if (searchParams.get('gsc') === 'connected') {
      showToast({
        type: 'success',
        title: 'Connected',
        description: 'Google Search Console connected successfully',
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/seo')
      if (response.ok) {
        const data = await response.json()
        const s = data.settings || {}
        setSettings({
          siteTitle: '',
          siteDescription: '',
          defaultOgImage: '',
          twitterCardType: 'summary_large_image',
          googleAnalyticsId: '',
          googleSearchConsoleVerification: '',
          canonicalUrlBase: '',
          organizationName: '',
          organizationLogo: '',
          organizationDescription: '',
          organizationContactInfo: '',
          organizationSocialFacebook: '',
          organizationSocialTwitter: '',
          organizationSocialLinkedIn: '',
          organizationSocialInstagram: '',
          organizationSocialYouTube: '',
          ...s,
        })
        // Load GSC credentials if saved
        if (s.gsc_client_id) {
          setGscClientId(s.gsc_client_id)
          setGscCredsSaved(true)
        }
        if (s.gsc_site_url) setGscSiteUrl(s.gsc_site_url)
      }
    } catch (error) {
      console.error('Failed to fetch SEO settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const checkGscStatus = async () => {
    try {
      // Use the test endpoint to check connection status without fetching analytics data
      const response = await fetch('/api/admin/seo-geo/search-console/test')
      if (response.ok) {
        const data = await response.json()
        // Connected if we got a configuredSiteUrl (means all credentials exist)
        setGscConnected(!!data.configuredSiteUrl)
      } else {
        // If test endpoint also fails, fall back to checking if credentials exist via settings
        const settingsRes = await fetch('/api/admin/seo')
        if (settingsRes.ok) {
          const sData = await settingsRes.json()
          const s = sData.settings || {}
          // If we have a refresh token (even masked), OAuth was completed
          setGscConnected(!!s.gsc_refresh_token)
        }
      }
    } catch {
      // GSC not connected
    }
  }

  const handleSaveGscCredentials = async () => {
    if (!gscClientId.trim() || (!gscCredsSaved && !gscClientSecret.trim()) || !gscSiteUrl.trim()) {
      showToast({
        type: 'error',
        title: 'Missing Fields',
        description: 'Please fill in Client ID, Client Secret, and Site URL',
      })
      return
    }

    setGscSavingCreds(true)
    try {
      const payload: Record<string, string> = {
        gsc_client_id: gscClientId.trim(),
        gsc_site_url: gscSiteUrl.trim(),
      }
      // Only include secret if user entered a new one
      if (gscClientSecret.trim()) {
        payload.gsc_client_secret = gscClientSecret.trim()
      }
      const response = await fetch('/api/admin/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (response.ok) {
        setGscCredsSaved(true)
        showToast({
          type: 'success',
          title: 'Credentials Saved',
          description: 'GSC credentials saved. Now click "Connect" to authorize.',
        })
      }
    } catch {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to save GSC credentials',
      })
    } finally {
      setGscSavingCreds(false)
    }
  }

  const handleConnectGsc = async () => {
    setGscConnecting(true)
    try {
      // First save credentials if they were entered
      if (gscClientId.trim() && gscClientSecret.trim()) {
        await handleSaveGscCredentials()
      }

      const response = await fetch('/api/admin/seo-geo/search-console/auth')
      if (response.ok) {
        const data = await response.json()
        if (data.authUrl) {
          window.location.href = data.authUrl
          return
        }
      } else {
        const error = await response.json()
        showToast({
          type: 'error',
          title: 'Connection Failed',
          description: error.error || 'Failed to initiate OAuth flow',
        })
      }
    } catch {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to connect to Google Search Console',
      })
    } finally {
      setGscConnecting(false)
    }
  }

  const handleDisconnectGsc = async () => {
    try {
      const response = await fetch('/api/admin/seo-geo/search-console/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' }),
      })
      if (response.ok) {
        setGscConnected(false)
        showToast({
          type: 'success',
          title: 'Disconnected',
          description: 'Google Search Console disconnected',
        })
      }
    } catch {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to disconnect',
      })
    }
  }

  const handleTestGsc = async () => {
    setGscTesting(true)
    setGscTestResult(null)
    try {
      const response = await fetch('/api/admin/seo-geo/search-console/test')
      const result = await response.json()
      setGscTestResult(result)
      if (result.success) {
        showToast({
          type: 'success',
          title: 'Connection OK',
          description: 'Successfully connected to Google Search Console',
        })
      } else {
        showToast({
          type: 'error',
          title: 'Connection Issue',
          description: result.error || 'Check the details below',
        })
      }
    } catch {
      showToast({
        type: 'error',
        title: 'Test Failed',
        description: 'Failed to test GSC connection',
      })
    } finally {
      setGscTesting(false)
    }
  }

  const handleFixSiteUrl = async (correctUrl: string) => {
    try {
      await fetch('/api/admin/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gsc_site_url: correctUrl }),
      })
      setGscSiteUrl(correctUrl)
      showToast({
        type: 'success',
        title: 'Site URL Updated',
        description: `Updated to ${correctUrl}`,
      })
      // Re-run test
      await handleTestGsc()
    } catch {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to update site URL',
      })
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Saved',
          description: 'SEO settings saved successfully',
        })
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Save Failed',
        description: 'Failed to save SEO settings',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleRegenerateSitemap = async () => {
    try {
      const response = await fetch('/api/admin/seo/sitemap/regenerate', {
        method: 'POST',
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Sitemap Regenerated',
          description: 'Sitemap has been regenerated successfully',
        })
      } else {
        throw new Error('Failed to regenerate')
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to regenerate sitemap',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">SEO & GEO Settings</h2>
        <p className="text-text-secondary">
          Manage global SEO settings, structured data, and integrations
        </p>
      </div>

      {/* Global SEO Settings */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-semibold text-white">Global SEO Settings</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Site Title
            </label>
            <Input
              value={settings.siteTitle}
              onChange={(e) =>
                setSettings({ ...settings, siteTitle: e.target.value })
              }
              placeholder="Argufight | AI-Judged Debate Platform"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Site Description
            </label>
            <textarea
              value={settings.siteDescription}
              onChange={(e) =>
                setSettings({ ...settings, siteDescription: e.target.value })
              }
              rows={3}
              maxLength={160}
              className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
              placeholder="Default meta description for the site"
            />
            <p className="text-xs text-text-secondary mt-1">
              {(settings.siteDescription || '').length}/160 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Default OG Image URL
            </label>
            <Input
              value={settings.defaultOgImage}
              onChange={(e) =>
                setSettings({ ...settings, defaultOgImage: e.target.value })
              }
              placeholder="https://www.argufight.com/og-image.png"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Twitter Card Type
            </label>
            <select
              value={settings.twitterCardType}
              onChange={(e) =>
                setSettings({ ...settings, twitterCardType: e.target.value })
              }
              className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
            >
              <option value="summary">Summary</option>
              <option value="summary_large_image">Summary Large Image</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Canonical URL Base
            </label>
            <Input
              value={settings.canonicalUrlBase}
              onChange={(e) =>
                setSettings({ ...settings, canonicalUrlBase: e.target.value })
              }
              placeholder="https://www.argufight.com"
            />
          </div>
        </CardBody>
      </Card>

      {/* Analytics & Verification */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-semibold text-white">Analytics & Verification</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Google Analytics ID
            </label>
            <Input
              value={settings.googleAnalyticsId}
              onChange={(e) =>
                setSettings({ ...settings, googleAnalyticsId: e.target.value })
              }
              placeholder="G-XXXXXXXXXX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Google Search Console Verification Code
            </label>
            <Input
              value={settings.googleSearchConsoleVerification}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  googleSearchConsoleVerification: e.target.value,
                })
              }
              placeholder="Verification meta tag content"
            />
          </div>
        </CardBody>
      </Card>

      {/* Google Search Console API */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">
              Google Search Console API
            </h3>
            {gscConnected && (
              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
                Connected
              </span>
            )}
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-text-secondary text-sm">
            Connect Google Search Console to see real-time ranking data, search
            queries, impressions, clicks, and average position in the Search Console tab.
          </p>

          {gscConnected ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-green-400 text-sm mb-3">
                  Google Search Console is connected. Ranking data is available in the Search Console tab.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={handleTestGsc}
                    disabled={gscTesting}
                    isLoading={gscTesting}
                  >
                    Test Connection
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleDisconnectGsc}
                    className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                  >
                    Disconnect GSC
                  </Button>
                </div>
              </div>

              {/* Test Results */}
              {gscTestResult && (
                <div className={`p-4 rounded-lg border ${
                  gscTestResult.success
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}>
                  <h4 className={`text-sm font-medium mb-2 ${
                    gscTestResult.success ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {gscTestResult.success ? 'Connection Successful' : 'Connection Issue'}
                  </h4>

                  {gscTestResult.error && (
                    <p className="text-red-400 text-sm mb-3">{gscTestResult.error}</p>
                  )}

                  {gscTestResult.configuredSiteUrl && (
                    <p className="text-text-secondary text-xs mb-2">
                      Configured URL: <code className="text-white">{gscTestResult.configuredSiteUrl}</code>
                    </p>
                  )}

                  {gscTestResult.availableSites.length > 0 && (
                    <div>
                      <p className="text-text-secondary text-xs mb-2">
                        Available sites in your Search Console:
                      </p>
                      <div className="space-y-1">
                        {gscTestResult.availableSites.map((site) => (
                          <div key={site.siteUrl} className="flex items-center gap-2">
                            <code className={`text-xs px-2 py-1 rounded ${
                              site.siteUrl === gscTestResult.configuredSiteUrl
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-bg-tertiary text-white'
                            }`}>
                              {site.siteUrl}
                            </code>
                            <span className="text-text-secondary text-xs">
                              ({site.permissionLevel})
                            </span>
                            {site.siteUrl !== gscTestResult.configuredSiteUrl && (
                              <button
                                onClick={() => handleFixSiteUrl(site.siteUrl)}
                                className="text-electric-blue text-xs hover:underline"
                              >
                                Use this
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {gscTestResult.availableSites.length === 0 && !gscTestResult.success && (
                    <p className="text-text-secondary text-xs">
                      No sites found. Make sure the Search Console API is enabled in your Google Cloud project
                      and the authenticated Google account has access to Search Console properties.
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="p-3 bg-bg-tertiary rounded-lg border border-bg-tertiary">
                <p className="text-text-secondary text-xs mb-1">
                  <strong className="text-white">Setup:</strong> Create a Google Cloud project, enable the Search Console API,
                  and create OAuth 2.0 credentials (Web application type).
                </p>
                <p className="text-text-secondary text-xs">
                  <strong className="text-white">Redirect URI:</strong>{' '}
                  <code className="text-electric-blue bg-bg-primary px-1 rounded">
                    {typeof window !== 'undefined' ? window.location.origin : 'https://www.argufight.com'}/api/admin/seo-geo/search-console/auth
                  </code>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  OAuth Client ID
                </label>
                <Input
                  value={gscClientId}
                  onChange={(e) => setGscClientId(e.target.value)}
                  placeholder="xxxx.apps.googleusercontent.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  OAuth Client Secret
                </label>
                <Input
                  type="password"
                  value={gscClientSecret}
                  onChange={(e) => setGscClientSecret(e.target.value)}
                  placeholder={gscCredsSaved ? '(saved - enter new value to update)' : 'GOCSPX-...'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Site URL
                </label>
                <Input
                  value={gscSiteUrl}
                  onChange={(e) => setGscSiteUrl(e.target.value)}
                  placeholder="https://www.argufight.com"
                />
                <p className="text-xs text-text-secondary mt-1">
                  Must match the property URL in Google Search Console exactly
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={handleSaveGscCredentials}
                  disabled={gscSavingCreds}
                  isLoading={gscSavingCreds}
                >
                  Save Credentials
                </Button>
                <Button
                  onClick={handleConnectGsc}
                  disabled={gscConnecting || (!gscCredsSaved && (!gscClientId.trim() || !gscClientSecret.trim()))}
                  isLoading={gscConnecting}
                >
                  Connect to Google
                </Button>
              </div>

              {/* Test Results (when not connected yet but credentials saved) */}
              {gscTestResult && (
                <div className={`p-4 rounded-lg border ${
                  gscTestResult.success
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}>
                  {gscTestResult.error && (
                    <p className="text-red-400 text-sm mb-2">{gscTestResult.error}</p>
                  )}
                  {gscTestResult.availableSites.length > 0 && (
                    <div>
                      <p className="text-text-secondary text-xs mb-2">
                        Available sites:
                      </p>
                      <div className="space-y-1">
                        {gscTestResult.availableSites.map((site) => (
                          <div key={site.siteUrl} className="flex items-center gap-2">
                            <code className="text-xs px-2 py-1 rounded bg-bg-tertiary text-white">
                              {site.siteUrl}
                            </code>
                            <button
                              onClick={() => handleFixSiteUrl(site.siteUrl)}
                              className="text-electric-blue text-xs hover:underline"
                            >
                              Use this
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      {/* Organization Schema */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-semibold text-white">
            Organization (Schema.org)
          </h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Organization Name
            </label>
            <Input
              value={settings.organizationName}
              onChange={(e) =>
                setSettings({ ...settings, organizationName: e.target.value })
              }
              placeholder="Argufight"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Organization Logo URL
            </label>
            <Input
              value={settings.organizationLogo}
              onChange={(e) =>
                setSettings({ ...settings, organizationLogo: e.target.value })
              }
              placeholder="https://www.argufight.com/logo.png"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Organization Description
            </label>
            <textarea
              value={settings.organizationDescription}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  organizationDescription: e.target.value,
                })
              }
              rows={3}
              className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
              placeholder="Description of your organization"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Contact Information
            </label>
            <Input
              value={settings.organizationContactInfo}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  organizationContactInfo: e.target.value,
                })
              }
              placeholder="info@argufight.com"
            />
          </div>
        </CardBody>
      </Card>

      {/* Social Media Profiles */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-semibold text-white">Social Media Profiles</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          {[
            { key: 'organizationSocialFacebook' as const, label: 'Facebook URL', placeholder: 'https://facebook.com/argufight' },
            { key: 'organizationSocialTwitter' as const, label: 'Twitter/X URL', placeholder: 'https://twitter.com/argufight' },
            { key: 'organizationSocialLinkedIn' as const, label: 'LinkedIn URL', placeholder: 'https://linkedin.com/company/argufight' },
            { key: 'organizationSocialInstagram' as const, label: 'Instagram URL', placeholder: 'https://instagram.com/argufight' },
            { key: 'organizationSocialYouTube' as const, label: 'YouTube URL', placeholder: 'https://youtube.com/@argufight' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-white mb-2">
                {label}
              </label>
              <Input
                value={settings[key]}
                onChange={(e) =>
                  setSettings({ ...settings, [key]: e.target.value })
                }
                placeholder={placeholder}
              />
            </div>
          ))}
        </CardBody>
      </Card>

      {/* Sitemap Management */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-semibold text-white">Sitemap Management</h3>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium mb-1">Sitemap</p>
              <p className="text-text-secondary text-sm">
                Your sitemap is automatically generated and available at{' '}
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-electric-blue hover:text-[#00B8E6]"
                >
                  /sitemap.xml
                </a>
              </p>
            </div>
            <Button variant="secondary" onClick={handleRegenerateSitemap}>
              Regenerate Sitemap
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} isLoading={isSaving}>
          Save All Settings
        </Button>
      </div>
    </div>
  )
}
