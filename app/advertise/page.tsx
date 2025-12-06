'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { LoadingSpinner } from '@/components/ui/Loading'
import { Tabs } from '@/components/ui/Tabs'
import { useAuth } from '@/lib/hooks/useAuth'
import Link from 'next/link'

export default function AdvertisePage() {
  const router = useRouter()
  const { showToast } = useToast()
  const { user, isLoading: authLoading } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    companyName: '',
    website: '',
    industry: '',
    contactName: '',
    contactEmail: '',
    businessEIN: '',
  })

  useEffect(() => {
    // If user is already logged in and is an advertiser, redirect to dashboard
    if (!authLoading && user) {
      fetch('/api/advertisers/me')
        .then(res => res.json())
        .then(data => {
          if (data.advertiser) {
            router.push('/advertiser/dashboard')
          }
        })
        .catch(() => {
          // Not an advertiser, stay on page
        })
    }
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/advertisers/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit application')
      }

      showToast({
        type: 'success',
        title: 'Application Submitted',
        description: 'Your application is under review. We\'ll notify you via email.',
      })

      router.push('/advertise/pending')
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to submit application',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Program Overview Tab
  const OverviewTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-text-primary mb-4">About the Advertiser Program</h3>
        <p className="text-text-secondary mb-4">
          The Argu Fight Advertiser Program allows businesses to reach our engaged community of debaters through targeted advertising campaigns. Whether you want to sponsor top creators or run platform-wide campaigns, we offer flexible solutions to meet your marketing goals.
        </p>
      </div>

      <div>
        <h3 className="text-xl font-bold text-text-primary mb-3">Program Benefits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardBody>
              <h4 className="font-bold text-text-primary mb-2">🎯 Targeted Audience</h4>
              <p className="text-sm text-text-secondary">
                Reach users by ELO rating, debate category, engagement level, and more
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <h4 className="font-bold text-text-primary mb-2">💰 Flexible Pricing</h4>
              <p className="text-sm text-text-secondary">
                Choose from flat rate, pay-per-click (CPC), pay-per-impression (CPM), or performance-based models
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <h4 className="font-bold text-text-primary mb-2">📊 Real-Time Analytics</h4>
              <p className="text-sm text-text-secondary">
                Track impressions, clicks, conversions, and ROI in real-time through your dashboard
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <h4 className="font-bold text-text-primary mb-2">🤝 Creator Partnerships</h4>
              <p className="text-sm text-text-secondary">
                Connect directly with top creators and negotiate custom sponsorship deals
              </p>
            </CardBody>
          </Card>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-text-primary mb-3">Ad Placement Options</h3>
        <div className="space-y-3">
          <Card>
            <CardBody>
              <h4 className="font-bold text-text-primary mb-2">Profile Banner Ads</h4>
              <p className="text-sm text-text-secondary">
                Display your ad at the top of creator profile pages. Great for brand awareness and visibility.
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <h4 className="font-bold text-text-primary mb-2">Post-Debate Ads</h4>
              <p className="text-sm text-text-secondary">
                Show ads after debate victories. Captures engaged viewers at high-momentum moments.
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <h4 className="font-bold text-text-primary mb-2">Debate Widget Ads</h4>
              <p className="text-sm text-text-secondary">
                Display ads in the sidebar during live debates. Reaches active viewers in real-time.
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <h4 className="font-bold text-text-primary mb-2">Platform-Wide Campaigns</h4>
              <p className="text-sm text-text-secondary">
                Run banner or in-feed ads across the entire platform for maximum reach.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )

  // How to Participate Tab
  const HowToParticipateTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-text-primary mb-4">How to Get Started</h3>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-electric-blue text-black font-bold flex items-center justify-center">
              1
            </div>
            <div>
              <h4 className="font-bold text-text-primary mb-2">Submit Application</h4>
              <p className="text-text-secondary">
                Fill out the advertiser application form with your company information. We'll review your application within 24-48 hours.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-electric-blue text-black font-bold flex items-center justify-center">
              2
            </div>
            <div>
              <h4 className="font-bold text-text-primary mb-2">Get Approved</h4>
              <p className="text-text-secondary">
                Once approved, you'll receive an email with login credentials and access to your advertiser dashboard.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-electric-blue text-black font-bold flex items-center justify-center">
              3
            </div>
            <div>
              <h4 className="font-bold text-text-primary mb-2">Create Campaigns</h4>
              <p className="text-text-secondary">
                Use the campaign creation wizard to set up your ads. Upload creatives, set targeting, and choose your budget.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-electric-blue text-black font-bold flex items-center justify-center">
              4
            </div>
            <div>
              <h4 className="font-bold text-text-primary mb-2">Make Offers to Creators</h4>
              <p className="text-text-secondary">
                Browse the creator marketplace, discover top debaters, and make custom sponsorship offers.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-electric-blue text-black font-bold flex items-center justify-center">
              5
            </div>
            <div>
              <h4 className="font-bold text-text-primary mb-2">Track Performance</h4>
              <p className="text-text-secondary">
                Monitor your campaigns in real-time. View analytics, adjust targeting, and optimize for better results.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-text-primary mb-3">Payment & Billing</h3>
        <Card>
          <CardBody>
            <p className="text-text-secondary mb-3">
              All payments are processed securely through Stripe. When you make an offer to a creator:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text-secondary">
              <li>Payment is held in escrow until the contract completes</li>
              <li>Platform fees are calculated based on creator tier (10-25%)</li>
              <li>Funds are automatically released to creators after contract completion</li>
              <li>You can track all transactions in your dashboard</li>
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  )

  // Rules & Guidelines Tab
  const RulesTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-text-primary mb-4">Advertising Rules & Guidelines</h3>
        <p className="text-text-secondary mb-4">
          To maintain a positive experience for our community, all advertisers must follow these rules:
        </p>
      </div>

      <Card>
        <CardHeader>
          <h4 className="font-bold text-text-primary">Content Guidelines</h4>
        </CardHeader>
        <CardBody>
          <ul className="list-disc list-inside space-y-2 text-text-secondary">
            <li>Ads must be truthful and not misleading</li>
            <li>No false claims or exaggerated statements</li>
            <li>Content must comply with applicable laws and regulations</li>
            <li>No offensive, discriminatory, or inappropriate content</li>
            <li>Respect intellectual property rights</li>
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h4 className="font-bold text-text-primary">Prohibited Content</h4>
        </CardHeader>
        <CardBody>
          <ul className="list-disc list-inside space-y-2 text-text-secondary">
            <li>Illegal products or services</li>
            <li>Adult content or explicit material</li>
            <li>Gambling or betting services (unless legally permitted)</li>
            <li>Weapons, drugs, or controlled substances</li>
            <li>Pyramid schemes or get-rich-quick scams</li>
            <li>Content that promotes violence or hate speech</li>
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h4 className="font-bold text-text-primary">Campaign Requirements</h4>
        </CardHeader>
        <CardBody>
          <ul className="list-disc list-inside space-y-2 text-text-secondary">
            <li>Minimum campaign duration: 7 days</li>
            <li>Maximum campaign duration: 365 days</li>
            <li>All campaigns require admin approval before going live</li>
            <li>Ad creatives must meet size and format requirements</li>
            <li>Campaigns can be paused or cancelled at any time</li>
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h4 className="font-bold text-text-primary">Creator Contracts</h4>
        </CardHeader>
        <CardBody>
          <ul className="list-disc list-inside space-y-2 text-text-secondary">
            <li>All contracts are binding once accepted by the creator</li>
            <li>Payment is held in escrow until contract completion</li>
            <li>Disputes should be reported through the Support system</li>
            <li>Platform fees are calculated at contract creation</li>
            <li>Contracts can be cancelled with proper notice (see terms)</li>
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h4 className="font-bold text-text-primary">Compliance</h4>
        </CardHeader>
        <CardBody>
          <p className="text-text-secondary mb-2">
            Advertisers are responsible for ensuring their ads comply with:
          </p>
          <ul className="list-disc list-inside space-y-2 text-text-secondary">
            <li>Federal Trade Commission (FTC) guidelines</li>
            <li>General Data Protection Regulation (GDPR) if applicable</li>
            <li>Platform-specific advertising policies</li>
            <li>Industry-specific regulations</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  )

  // Application/Signup Tab
  const ApplicationTab = () => (
    <div className="space-y-6">
      {user ? (
        <Card className="border-electric-blue/50">
          <CardBody>
            <div className="text-center">
              <p className="text-text-secondary mb-4">
                You're already logged in. If you're an approved advertiser, you can access your dashboard.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="primary" onClick={() => router.push('/advertiser/dashboard')}>
                  Go to Dashboard
                </Button>
                <Button variant="secondary" onClick={() => router.push('/logout')}>
                  Logout
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card className="border-electric-blue/50">
          <CardBody>
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-text-primary mb-2">Already an Advertiser?</h3>
              <p className="text-text-secondary mb-4">
                Log in to access your advertiser dashboard
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="primary" onClick={() => router.push('/login')}>
                  Login
                </Button>
                <Button variant="secondary" onClick={() => router.push('/signup')}>
                  Sign Up
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold text-text-primary">New Advertiser Application</h2>
          <p className="text-text-secondary mt-2">
            Fill out the form below to apply for the Advertiser Program. We'll review your application and get back to you within 24-48 hours.
          </p>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Company Name *
              </label>
              <Input
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Your Company Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Website URL *
              </label>
              <Input
                type="url"
                required
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Industry *
              </label>
              <select
                required
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-electric-blue"
              >
                <option value="">Select Industry</option>
                <option value="TECH">Technology</option>
                <option value="FASHION">Fashion</option>
                <option value="SPORTS">Sports</option>
                <option value="FINANCE">Finance</option>
                <option value="EDUCATION">Education</option>
                <option value="ENTERTAINMENT">Entertainment</option>
                <option value="HEALTH">Health & Wellness</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Contact Name *
              </label>
              <Input
                required
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                placeholder="Your Full Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Contact Email *
              </label>
              <Input
                type="email"
                required
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Business EIN (Optional)
              </label>
              <Input
                value={formData.businessEIN}
                onChange={(e) => setFormData({ ...formData, businessEIN: e.target.value })}
                placeholder="XX-XXXXXXX"
              />
              <p className="text-xs text-text-secondary mt-1">
                For verification purposes. Not required for individual advertisers.
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  )

  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="ADVERTISE" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="ADVERTISE" />
      <div className="pt-20 px-4 md:px-8 pb-20">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-text-primary mb-4">
              Advertise on Argu Fight
            </h1>
            <p className="text-xl text-text-secondary mb-8">
              Reach engaged debaters. Sponsor top creators. Pay only for results.
            </p>
          </div>

          {/* Tabs */}
          <Card>
            <Tabs
              tabs={[
                { id: 'overview', label: 'Program Overview', content: <OverviewTab /> },
                { id: 'how-to', label: 'How to Participate', content: <HowToParticipateTab /> },
                { id: 'rules', label: 'Rules & Guidelines', content: <RulesTab /> },
                { id: 'apply', label: 'Apply / Sign Up', content: <ApplicationTab /> },
              ]}
              defaultTab="overview"
            />
          </Card>
        </div>
      </div>
    </div>
  )
}
