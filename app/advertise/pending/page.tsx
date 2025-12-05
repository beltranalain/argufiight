'use client'

import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'

export default function AdvertisePendingPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="ADVERTISE" />
      <div className="pt-20 px-4 md:px-8 pb-20">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <h1 className="text-3xl font-bold text-text-primary">Application Submitted</h1>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-cyber-green">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-lg font-semibold">Your application has been received!</p>
                </div>

                <div className="bg-bg-secondary rounded-lg p-4 space-y-2">
                  <p className="text-text-primary">
                    We're reviewing your advertiser application and will get back to you within <strong>24-48 hours</strong>.
                  </p>
                  <p className="text-text-secondary">
                    You'll receive an email notification once your application has been reviewed. Check your inbox (and spam folder) for updates.
                  </p>
                </div>

                <div className="border-t border-bg-tertiary pt-4">
                  <h3 className="text-lg font-bold text-text-primary mb-2">What happens next?</h3>
                  <ul className="space-y-2 text-text-secondary">
                    <li className="flex items-start gap-2">
                      <span className="text-electric-blue">1.</span>
                      <span>Our team reviews your application</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-electric-blue">2.</span>
                      <span>You'll receive an approval or rejection email</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-electric-blue">3.</span>
                      <span>If approved, you'll get access to the advertiser dashboard</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-electric-blue">4.</span>
                      <span>Connect your Stripe account to start creating campaigns</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

