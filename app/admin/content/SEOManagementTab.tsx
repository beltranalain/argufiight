'use client'

import { useState, useEffect } from 'react'
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

export default function SEOManagementTab() {
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
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
  }, [])

  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/seo')
      if (response.ok) {
        const data = await response.json()
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
          ...(data.settings || {}),
        })
      }
    } catch (error) {
      console.error('Failed to fetch SEO settings:', error)
    } finally {
      setIsLoading(false)
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
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">SEO Settings</h2>
        <p className="text-text-secondary">Manage global SEO settings and structured data</p>
      </div>

      <div className="space-y-6">
        {/* Global SEO Settings */}
        <Card>
          <CardHeader>
            <h3 className="text-xl font-semibold text-white">Global SEO Settings</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Site Title</label>
              <Input
                value={settings.siteTitle}
                onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })}
                placeholder="Argufight | AI-Judged Debate Platform"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Site Description</label>
              <textarea
                value={settings.siteDescription}
                onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
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
              <label className="block text-sm font-medium text-white mb-2">Default OG Image URL</label>
              <Input
                value={settings.defaultOgImage}
                onChange={(e) => setSettings({ ...settings, defaultOgImage: e.target.value })}
                placeholder="https://www.argufight.com/og-image.png"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Twitter Card Type</label>
              <select
                value={settings.twitterCardType}
                onChange={(e) => setSettings({ ...settings, twitterCardType: e.target.value })}
                className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
              >
                <option value="summary">Summary</option>
                <option value="summary_large_image">Summary Large Image</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Canonical URL Base</label>
              <Input
                value={settings.canonicalUrlBase}
                onChange={(e) => setSettings({ ...settings, canonicalUrlBase: e.target.value })}
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
              <label className="block text-sm font-medium text-white mb-2">Google Analytics ID</label>
              <Input
                value={settings.googleAnalyticsId}
                onChange={(e) => setSettings({ ...settings, googleAnalyticsId: e.target.value })}
                placeholder="G-XXXXXXXXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Google Search Console Verification Code
              </label>
              <Input
                value={settings.googleSearchConsoleVerification}
                onChange={(e) => setSettings({ ...settings, googleSearchConsoleVerification: e.target.value })}
                placeholder="Verification meta tag content"
              />
            </div>
          </CardBody>
        </Card>

        {/* Organization Schema */}
        <Card>
          <CardHeader>
            <h3 className="text-xl font-semibold text-white">Organization (Schema.org)</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Organization Name</label>
              <Input
                value={settings.organizationName}
                onChange={(e) => setSettings({ ...settings, organizationName: e.target.value })}
                placeholder="Argufight"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Organization Logo URL</label>
              <Input
                value={settings.organizationLogo}
                onChange={(e) => setSettings({ ...settings, organizationLogo: e.target.value })}
                placeholder="https://www.argufight.com/logo.png"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Organization Description</label>
              <textarea
                value={settings.organizationDescription}
                onChange={(e) => setSettings({ ...settings, organizationDescription: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
                placeholder="Description of your organization"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Contact Information</label>
              <Input
                value={settings.organizationContactInfo}
                onChange={(e) => setSettings({ ...settings, organizationContactInfo: e.target.value })}
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
            <div>
              <label className="block text-sm font-medium text-white mb-2">Facebook URL</label>
              <Input
                value={settings.organizationSocialFacebook}
                onChange={(e) => setSettings({ ...settings, organizationSocialFacebook: e.target.value })}
                placeholder="https://facebook.com/argufight"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Twitter/X URL</label>
              <Input
                value={settings.organizationSocialTwitter}
                onChange={(e) => setSettings({ ...settings, organizationSocialTwitter: e.target.value })}
                placeholder="https://twitter.com/argufight"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">LinkedIn URL</label>
              <Input
                value={settings.organizationSocialLinkedIn}
                onChange={(e) => setSettings({ ...settings, organizationSocialLinkedIn: e.target.value })}
                placeholder="https://linkedin.com/company/argufight"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Instagram URL</label>
              <Input
                value={settings.organizationSocialInstagram}
                onChange={(e) => setSettings({ ...settings, organizationSocialInstagram: e.target.value })}
                placeholder="https://instagram.com/argufight"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">YouTube URL</label>
              <Input
                value={settings.organizationSocialYouTube}
                onChange={(e) => setSettings({ ...settings, organizationSocialYouTube: e.target.value })}
                placeholder="https://youtube.com/@argufight"
              />
            </div>
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
    </div>
  )
}

