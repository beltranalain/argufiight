'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { LoadingSpinner } from '@/components/ui/Loading'

export default function AdvertisePage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    companyName: '',
    website: '',
    industry: '',
    contactName: '',
    contactEmail: '',
    businessEIN: '',
  })

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

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="ADVERTISE" />
      <div className="pt-20 px-4 md:px-8 pb-20">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-text-primary mb-4">
              Advertise on Argu Fight
            </h1>
            <p className="text-xl text-text-secondary mb-8">
              Reach engaged debaters. Sponsor top creators. Pay only for results.
            </p>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardBody className="text-center">
                <div className="text-3xl mb-4">🎯</div>
                <h3 className="text-lg font-bold text-text-primary mb-2">Targeted Audience</h3>
                <p className="text-sm text-text-secondary">
                  Reach users by ELO, category, and engagement level
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center">
                <div className="text-3xl mb-4">💰</div>
                <h3 className="text-lg font-bold text-text-primary mb-2">Flexible Pricing</h3>
                <p className="text-sm text-text-secondary">
                  Flat rate, CPC, CPM, or performance-based models
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center">
                <div className="text-3xl mb-4">📊</div>
                <h3 className="text-lg font-bold text-text-primary mb-2">Real-Time Analytics</h3>
                <p className="text-sm text-text-secondary">
                  Track impressions, clicks, and ROI in real-time
                </p>
              </CardBody>
            </Card>
          </div>

          {/* Application Form */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold text-text-primary">Advertiser Application</h2>
              <p className="text-text-secondary mt-2">
                Fill out the form below. We'll review your application and get back to you within 24-48 hours.
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
      </div>
    </div>
  )
}

