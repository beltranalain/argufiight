import type { Metadata } from 'next'
import Link from 'next/link'
import { requireFeature } from '@/lib/features'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Pricing - Argufight | Free AI-Judged Debate Platform',
  description: 'Argufight offers free AI-judged debates forever. Upgrade to Pro for advanced features, unlimited debates, and priority support. No credit card required to start.',
  keywords: 'debate platform pricing, free debates, pro features, ELO ranking, debate tournaments',
  openGraph: {
    title: 'Pricing - Argufight',
    description: 'Start debating for free. Upgrade to Pro for advanced features and unlimited debates.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.argufight.com/pricing',
  },
}

export default async function PricingPage() {
  await requireFeature('SUBSCRIPTIONS')
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.argufight.com'

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Argufight Debate Platform",
    "description": "AI-judged debate platform with free and pro tiers",
    "offers": [
      {
        "@type": "Offer",
        "name": "Free Plan",
        "price": "0",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
      },
      {
        "@type": "Offer",
        "name": "Pro Plan",
        "price": "9.99",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-indigo-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-text-primary/80">
              Start free. Upgrade when you're ready for more.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Free Plan */}
            <div className="bg-bg-secondary border border-bg-tertiary rounded-xl p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Free</h2>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-electric-blue">$0</span>
                  <span className="text-text-primary/60">/forever</span>
                </div>
                <p className="text-text-primary/80 mt-2">Perfect for getting started</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <span className="text-cyber-green text-xl">✓</span>
                  <span className="text-text-primary/90">Unlimited debates</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyber-green text-xl">✓</span>
                  <span className="text-text-primary/90">7 AI judge personalities</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyber-green text-xl">✓</span>
                  <span className="text-text-primary/90">ELO ranking system</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyber-green text-xl">✓</span>
                  <span className="text-text-primary/90">Public debate sharing</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyber-green text-xl">✓</span>
                  <span className="text-text-primary/90">Basic tournament participation</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyber-green text-xl">✓</span>
                  <span className="text-text-primary/90">Community support</span>
                </li>
              </ul>

              <Link
                href="/signup"
                className="block w-full text-center px-6 py-3 border-2 border-electric-blue text-electric-blue rounded-lg font-semibold hover:bg-electric-blue/10 transition-colors"
              >
                Get Started Free
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-gradient-to-br from-electric-blue/20 to-purple-600/20 border-2 border-electric-blue rounded-xl p-8 relative">
              <div className="absolute top-4 right-4 bg-electric-blue text-black px-3 py-1 rounded-full text-sm font-semibold">
                POPULAR
              </div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Pro</h2>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-electric-blue">$9.99</span>
                  <span className="text-text-primary/60">/month</span>
                </div>
                <p className="text-text-primary/80 mt-2">For serious debaters</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <span className="text-cyber-green text-xl">✓</span>
                  <span className="text-text-primary/90">Everything in Free</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyber-green text-xl">✓</span>
                  <span className="text-text-primary/90">Priority debate matching</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyber-green text-xl">✓</span>
                  <span className="text-text-primary/90">Advanced analytics & insights</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyber-green text-xl">✓</span>
                  <span className="text-text-primary/90">Private debates</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyber-green text-xl">✓</span>
                  <span className="text-text-primary/90">Exclusive tournaments</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyber-green text-xl">✓</span>
                  <span className="text-text-primary/90">Priority support</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyber-green text-xl">✓</span>
                  <span className="text-text-primary/90">Custom judge preferences</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyber-green text-xl">✓</span>
                  <span className="text-text-primary/90">Debate export & sharing tools</span>
                </li>
              </ul>

              <Link
                href="/signup?tier=pro"
                className="block w-full text-center px-6 py-3 bg-electric-blue text-black rounded-lg font-semibold hover:bg-[#00B8E6] transition-colors"
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>

          {/* FAQ Section */}
          <section className="bg-bg-secondary border border-bg-tertiary rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-electric-blue mb-2">Is the free plan really free forever?</h3>
                <p className="text-text-primary/90">
                  Yes! The free plan includes all core features and will always be free. You can debate as much as you want without any credit card required.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-electric-blue mb-2">Can I cancel my Pro subscription anytime?</h3>
                <p className="text-text-primary/90">
                  Absolutely. You can cancel your Pro subscription at any time. You'll continue to have access to Pro features until the end of your billing period.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-electric-blue mb-2">What payment methods do you accept?</h3>
                <p className="text-text-primary/90">
                  We accept all major credit cards, debit cards, and PayPal. All payments are processed securely through Stripe.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-electric-blue mb-2">Do you offer refunds?</h3>
                <p className="text-text-primary/90">
                  Yes, we offer a 30-day money-back guarantee. If you're not satisfied with Pro, contact us within 30 days for a full refund.
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <div className="text-center mt-12">
            <p className="text-text-primary/80 mb-6">
              Still have questions? <Link href="/faq" className="text-electric-blue hover:underline">Visit our FAQ</Link> or <Link href="/support" className="text-electric-blue hover:underline">contact support</Link>.
            </p>
            <Link
              href="/signup"
              className="inline-block px-8 py-3 bg-electric-blue text-black rounded-lg font-semibold hover:bg-[#00B8E6] transition-colors"
            >
              Start Debating Free
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

