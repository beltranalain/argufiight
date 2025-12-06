'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
      // Normalize website URL - add https:// if missing
      let normalizedWebsite = formData.website.trim()
      if (normalizedWebsite && !normalizedWebsite.match(/^https?:\/\//i)) {
        normalizedWebsite = `https://${normalizedWebsite}`
      }

      const response = await fetch('/api/advertisers/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          website: normalizedWebsite,
        }),
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
        <h3 className="text-2xl font-bold text-white mb-4">About the Advertiser Program</h3>
        <p className="text-white/90 mb-4">
          The Argu Fight Advertiser Program allows businesses to reach our engaged community of debaters through targeted advertising campaigns. Whether you want to sponsor top creators or run platform-wide campaigns, we offer flexible solutions to meet your marketing goals.
        </p>
      </div>

      <div>
        <h3 className="text-xl font-bold text-white mb-3">Program Benefits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/20 bg-purple-800/30 backdrop-blur-sm p-4">
            <h4 className="font-bold text-white mb-2">🎯 Targeted Audience</h4>
            <p className="text-sm text-white/80">
              Reach users by ELO rating, debate category, engagement level, and more
            </p>
          </div>
          <div className="rounded-xl border border-white/20 bg-purple-800/30 backdrop-blur-sm p-4">
            <h4 className="font-bold text-white mb-2">💰 Flexible Pricing</h4>
            <p className="text-sm text-white/80">
              Choose from flat rate, pay-per-click (CPC), pay-per-impression (CPM), or performance-based models
            </p>
          </div>
          <div className="rounded-xl border border-white/20 bg-purple-800/30 backdrop-blur-sm p-4">
            <h4 className="font-bold text-white mb-2">📊 Real-Time Analytics</h4>
            <p className="text-sm text-white/80">
              Track impressions, clicks, conversions, and ROI in real-time through your dashboard
            </p>
          </div>
          <div className="rounded-xl border border-white/20 bg-purple-800/30 backdrop-blur-sm p-4">
            <h4 className="font-bold text-white mb-2">🤝 Creator Partnerships</h4>
            <p className="text-sm text-white/80">
              Connect directly with top creators and negotiate custom sponsorship deals
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-white mb-3">Ad Placement Options</h3>
        <div className="space-y-3">
          <div className="rounded-xl border border-white/20 bg-purple-800/30 backdrop-blur-sm p-4">
            <h4 className="font-bold text-white mb-2">Profile Banner Ads</h4>
            <p className="text-sm text-white/80">
              Display your ad at the top of creator profile pages. Great for brand awareness and visibility.
            </p>
          </div>
          <div className="rounded-xl border border-white/20 bg-purple-800/30 backdrop-blur-sm p-4">
            <h4 className="font-bold text-white mb-2">Post-Debate Ads</h4>
            <p className="text-sm text-white/80">
              Show ads after debate victories. Captures engaged viewers at high-momentum moments.
            </p>
          </div>
          <div className="rounded-xl border border-white/20 bg-purple-800/30 backdrop-blur-sm p-4">
            <h4 className="font-bold text-white mb-2">Debate Widget Ads</h4>
            <p className="text-sm text-white/80">
              Display ads in the sidebar during live debates. Reaches active viewers in real-time.
            </p>
          </div>
          <div className="rounded-xl border border-white/20 bg-purple-800/30 backdrop-blur-sm p-4">
            <h4 className="font-bold text-white mb-2">Platform-Wide Campaigns</h4>
            <p className="text-sm text-white/80">
              Run banner or in-feed ads across the entire platform for maximum reach.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  // How to Participate Tab
  const HowToParticipateTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-white mb-4">How to Get Started</h3>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-electric-blue text-black font-bold flex items-center justify-center">
              1
            </div>
            <div>
              <h4 className="font-bold text-white mb-2">Submit Application</h4>
              <p className="text-white/80">
                Fill out the advertiser application form with your company information. We'll review your application within 24-48 hours.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-electric-blue text-black font-bold flex items-center justify-center">
              2
            </div>
            <div>
              <h4 className="font-bold text-white mb-2">Get Approved</h4>
              <p className="text-white/80">
                Once approved, you'll receive an email with login credentials and access to your advertiser dashboard.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-electric-blue text-black font-bold flex items-center justify-center">
              3
            </div>
            <div>
              <h4 className="font-bold text-white mb-2">Create Campaigns</h4>
              <p className="text-white/80">
                Use the campaign creation wizard to set up your ads. Upload creatives, set targeting, and choose your budget.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-electric-blue text-black font-bold flex items-center justify-center">
              4
            </div>
            <div>
              <h4 className="font-bold text-white mb-2">Make Offers to Creators</h4>
              <p className="text-white/80">
                Browse the creator marketplace, discover top debaters, and make custom sponsorship offers.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-electric-blue text-black font-bold flex items-center justify-center">
              5
            </div>
            <div>
              <h4 className="font-bold text-white mb-2">Track Performance</h4>
              <p className="text-white/80">
                Monitor your campaigns in real-time. View analytics, adjust targeting, and optimize for better results.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-white mb-3">Payment & Billing</h3>
        <div className="rounded-xl border border-white/20 bg-purple-800/30 backdrop-blur-sm p-4">
          <p className="text-white/90 mb-3">
            All payments are processed securely through Stripe. When you make an offer to a creator:
          </p>
          <ul className="list-disc list-inside space-y-2 text-white/80">
            <li>Payment is held in escrow until the contract completes</li>
            <li>Platform fees are calculated based on creator tier (10-25%)</li>
            <li>Funds are automatically released to creators after contract completion</li>
            <li>You can track all transactions in your dashboard</li>
          </ul>
        </div>
      </div>
    </div>
  )

  // Rules & Guidelines Tab
  const RulesTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-white mb-4">Advertising Rules & Guidelines</h3>
        <p className="text-white/90 mb-4">
          To maintain a positive experience for our community, all advertisers must follow these rules:
        </p>
      </div>

      <div className="rounded-xl border border-white/20 bg-purple-800/30 backdrop-blur-sm p-4">
        <h4 className="font-bold text-white mb-3">Content Guidelines</h4>
        <ul className="list-disc list-inside space-y-2 text-white/80">
          <li>Ads must be truthful and not misleading</li>
          <li>No false claims or exaggerated statements</li>
          <li>Content must comply with applicable laws and regulations</li>
          <li>No offensive, discriminatory, or inappropriate content</li>
          <li>Respect intellectual property rights</li>
        </ul>
      </div>

      <div className="rounded-xl border border-white/20 bg-purple-800/30 backdrop-blur-sm p-4">
        <h4 className="font-bold text-white mb-3">Prohibited Content</h4>
        <ul className="list-disc list-inside space-y-2 text-white/80">
          <li>Illegal products or services</li>
          <li>Adult content or explicit material</li>
          <li>Gambling or betting services (unless legally permitted)</li>
          <li>Weapons, drugs, or controlled substances</li>
          <li>Pyramid schemes or get-rich-quick scams</li>
          <li>Content that promotes violence or hate speech</li>
        </ul>
      </div>

      <div className="rounded-xl border border-white/20 bg-purple-800/30 backdrop-blur-sm p-4">
        <h4 className="font-bold text-white mb-3">Campaign Requirements</h4>
        <ul className="list-disc list-inside space-y-2 text-white/80">
          <li>Minimum campaign duration: 7 days</li>
          <li>Maximum campaign duration: 365 days</li>
          <li>All campaigns require admin approval before going live</li>
          <li>Ad creatives must meet size and format requirements</li>
          <li>Campaigns can be paused or cancelled at any time</li>
        </ul>
      </div>

      <div className="rounded-xl border border-white/20 bg-purple-800/30 backdrop-blur-sm p-4">
        <h4 className="font-bold text-white mb-3">Creator Contracts</h4>
        <ul className="list-disc list-inside space-y-2 text-white/80">
          <li>All contracts are binding once accepted by the creator</li>
          <li>Payment is held in escrow until contract completion</li>
          <li>Disputes should be reported through the Support system</li>
          <li>Platform fees are calculated at contract creation</li>
          <li>Contracts can be cancelled with proper notice (see terms)</li>
        </ul>
      </div>

      <div className="rounded-xl border border-white/20 bg-purple-800/30 backdrop-blur-sm p-4">
        <h4 className="font-bold text-white mb-3">Compliance</h4>
        <p className="text-white/90 mb-2">
          Advertisers are responsible for ensuring their ads comply with:
        </p>
        <ul className="list-disc list-inside space-y-2 text-white/80">
          <li>Federal Trade Commission (FTC) guidelines</li>
          <li>General Data Protection Regulation (GDPR) if applicable</li>
          <li>Platform-specific advertising policies</li>
          <li>Industry-specific regulations</li>
        </ul>
      </div>
    </div>
  )

  // Application/Signup Tab
  const ApplicationTab = () => (
    <div className="space-y-6">
      {user ? (
        <div className="rounded-xl border border-electric-blue/50 bg-purple-800/30 backdrop-blur-sm p-6">
          <div className="text-center">
            <p className="text-white/90 mb-4">
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
        </div>
      ) : (
        <div className="rounded-xl border border-electric-blue/50 bg-purple-800/30 backdrop-blur-sm p-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-white mb-2">Already an Advertiser?</h3>
            <p className="text-white/90 mb-4">
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
        </div>
      )}

      <div className="rounded-xl border border-white/20 bg-purple-800/30 backdrop-blur-sm p-6">
        <h2 className="text-2xl font-bold text-white mb-2">New Advertiser Application</h2>
        <p className="text-white/90 mb-6">
          Fill out the form below to apply for the Advertiser Program. We'll review your application and get back to you within 24-48 hours.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Company Name *
            </label>
            <input
              required
              value={formData.companyName}
              onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
              placeholder="Your Company Name"
              className="w-full px-4 py-2 bg-purple-900/50 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-electric-blue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Website URL *
            </label>
            <input
              type="text"
              required
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              placeholder="example.com or https://example.com"
              className="w-full px-4 py-2 bg-purple-900/50 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-electric-blue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Industry *
            </label>
            <select
              required
              value={formData.industry}
              onChange={(e) => {
                const value = e.target.value
                setFormData(prev => ({ ...prev, industry: value }))
              }}
              className="w-full px-4 py-2 bg-purple-900/50 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
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
            <label className="block text-sm font-medium text-white/90 mb-2">
              Contact Name *
            </label>
            <input
              required
              value={formData.contactName}
              onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
              placeholder="Your Full Name"
              className="w-full px-4 py-2 bg-purple-900/50 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-electric-blue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Contact Email *
            </label>
            <input
              type="email"
              required
              value={formData.contactEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
              placeholder="your@email.com"
              className="w-full px-4 py-2 bg-purple-900/50 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-electric-blue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Business EIN (Optional)
            </label>
            <input
              value={formData.businessEIN}
              onChange={(e) => setFormData(prev => ({ ...prev, businessEIN: e.target.value }))}
              placeholder="XX-XXXXXXX"
              className="w-full px-4 py-2 bg-purple-900/50 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-electric-blue"
            />
            <p className="text-xs text-white/70 mt-1">
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
      </div>
    </div>
  )

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-indigo-950 relative overflow-hidden">
        {/* Starry background */}
        <div className="fixed inset-0 opacity-30 pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.4) 1px, transparent 0)`,
            backgroundSize: '50px 50px',
          }} />
        </div>
        <nav className="fixed top-0 left-0 right-0 z-50 bg-purple-950/80 backdrop-blur-md border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="text-2xl font-bold text-electric-blue">
                ARGU FIGHT
              </Link>
              <div className="flex items-center gap-4">
                <Link href="/login" className="px-4 py-2 text-white hover:text-electric-blue transition-colors">
                  Login
                </Link>
                <Link href="/signup" className="px-6 py-2 bg-electric-blue text-black rounded-lg font-semibold hover:bg-[#00B8E6] transition-colors">
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-indigo-950 relative overflow-hidden">
      {/* Starry background */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.4) 1px, transparent 0)`,
          backgroundSize: '50px 50px',
        }} />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-purple-950/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-2xl font-bold text-electric-blue">
              ARGU FIGHT
            </Link>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Link href="/advertiser/dashboard" className="px-4 py-2 text-white hover:text-electric-blue transition-colors">
                    Dashboard
                  </Link>
                  <Link href="/logout" className="px-6 py-2 bg-electric-blue text-black rounded-lg font-semibold hover:bg-[#00B8E6] transition-colors">
                    Logout
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="px-4 py-2 text-white hover:text-electric-blue transition-colors">
                    Login
                  </Link>
                  <Link href="/signup" className="px-6 py-2 bg-electric-blue text-black rounded-lg font-semibold hover:bg-[#00B8E6] transition-colors">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 pt-24 px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              Advertise on Argu Fight
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Reach engaged debaters. Sponsor top creators. Pay only for results.
            </p>
          </div>

          {/* Tabs - Glassmorphism Card */}
          <div className="relative rounded-3xl border border-white/20 bg-purple-900/30 backdrop-blur-md p-8 md:p-12 shadow-2xl">
            <Tabs
              tabs={[
                { id: 'overview', label: 'Program Overview', content: <OverviewTab /> },
                { id: 'how-to', label: 'How to Participate', content: <HowToParticipateTab /> },
                { id: 'rules', label: 'Rules & Guidelines', content: <RulesTab /> },
                { id: 'apply', label: 'Apply / Sign Up', content: <ApplicationTab /> },
              ]}
              defaultTab="overview"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
