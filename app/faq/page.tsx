import type { Metadata } from 'next'
import Link from 'next/link'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'FAQ - Argufight | Frequently Asked Questions',
  description: 'Get answers to frequently asked questions about Argufight, the AI-judged debate platform. Learn about how debates work, ELO rankings, tournaments, and more.',
  keywords: 'argufight FAQ, debate platform questions, how debates work, ELO ranking, AI judges',
  openGraph: {
    title: 'FAQ - Argufight',
    description: 'Frequently asked questions about Argufight debate platform',
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.argufight.com/faq',
  },
}

export default function FAQPage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.argufight.com'

  // Generate FAQPage schema
  const faqs = [
    {
      category: 'Getting Started',
      questions: [
        {
          q: 'How do I create my first debate?',
          a: 'Click "Create Debate" on the homepage, choose a topic, select a category, and either challenge a specific user or create an open challenge. Once someone accepts, your debate begins!',
        },
        {
          q: 'Do I need to pay to use Argufight?',
          a: 'No! Argufight is completely free to use. You can create unlimited debates, get judged by AI, and climb the leaderboard without paying anything. We offer a Pro plan with additional features, but the core platform is free forever.',
        },
        {
          q: 'How long does a debate take?',
          a: 'Each debate consists of 5 rounds. You and your opponent take turns submitting arguments. Each round has a time limit, typically 24-48 hours. A complete debate usually takes 5-10 days depending on how quickly participants respond.',
        },
      ],
    },
    {
      category: 'How Debates Work',
      questions: [
        {
          q: 'How are debates judged?',
          a: 'After all 5 rounds are complete, 7 unique AI judge personalities evaluate your debate. Each judge has different perspectives and criteria. They provide scores, determine winners, and give detailed feedback on your arguments.',
        },
        {
          q: 'What makes a good argument?',
          a: 'Good arguments use clear logic, credible evidence, and address counterarguments. Our AI judges evaluate reasoning quality, evidence usage, persuasiveness, and how well you respond to your opponent\'s points.',
        },
        {
          q: 'Can I see debates before they\'re judged?',
          a: 'Yes! You can view active debates as they progress. Once a debate is completed and judged, it becomes publicly viewable (if set to public visibility) and you can see all arguments and judge feedback.',
        },
      ],
    },
    {
      category: 'ELO Rankings',
      questions: [
        {
          q: 'How does the ELO ranking system work?',
          a: 'ELO is a skill-based rating system. When you win a debate, your ELO increases. When you lose, it decreases. The amount of change depends on your opponent\'s ELO - beating a higher-rated opponent gives you more points.',
        },
        {
          q: 'What\'s a good ELO rating?',
          a: 'ELO ratings typically range from 1000-2000+. New users start around 1200. Ratings above 1500 indicate strong argumentation skills. The top debaters on our leaderboard often have ratings above 1800.',
        },
        {
          q: 'Can my ELO go down?',
          a: 'Yes, your ELO can decrease if you lose debates, especially against lower-rated opponents. This is normal and helps ensure accurate skill matching. Focus on improving your arguments rather than just your rating.',
        },
      ],
    },
    {
      category: 'Tournaments',
      questions: [
        {
          q: 'How do tournaments work?',
          a: 'Tournaments are structured competitions where debaters compete in brackets. You progress through rounds by winning debates. Tournaments can be single-elimination or round-robin format, and winners receive recognition and sometimes prizes.',
        },
        {
          q: 'Can I create my own tournament?',
          a: 'Tournament creation is available to Pro users. Free users can participate in public tournaments created by others.',
        },
        {
          q: 'What happens if I can\'t complete a tournament debate?',
          a: 'If you don\'t submit arguments within the time limit, you may forfeit the round. Tournament organizers can set specific rules for handling forfeits. Check tournament details before joining.',
        },
      ],
    },
    {
      category: 'Technical',
      questions: [
        {
          q: 'Do I need to download anything?',
          a: 'No! Argufight is a web-based platform. You can access it from any device with a web browser. We also offer mobile apps for iOS and Android (coming soon).',
        },
        {
          q: 'Can I debate on mobile?',
          a: 'Yes! Argufight is fully responsive and works on mobile devices. You can create debates, submit arguments, and view results from your phone or tablet.',
        },
        {
          q: 'How do I report a problem?',
          a: 'You can report issues through our support system. Visit the support page or email support@argufight.com. We typically respond within 24-48 hours.',
        },
      ],
    },
  ]

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.flatMap(category =>
      category.questions.map(qa => ({
        "@type": "Question",
        "name": qa.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": qa.a,
        },
      }))
    ),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-indigo-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-text-primary/80">
              Everything you need to know about Argufight
            </p>
          </div>

          <div className="space-y-8">
            {faqs.map((category, categoryIndex) => (
              <section key={categoryIndex} className="bg-bg-secondary border border-bg-tertiary rounded-xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6">{category.category}</h2>
                <div className="space-y-6">
                  {category.questions.map((faq, index) => (
                    <div key={index} className="border-b border-bg-tertiary last:border-0 pb-6 last:pb-0">
                      <h3 className="text-lg font-semibold text-electric-blue mb-2">{faq.q}</h3>
                      <p className="text-text-primary/90">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Still Have Questions */}
          <section className="bg-gradient-to-r from-electric-blue/20 to-purple-600/20 border border-electric-blue/50 rounded-xl p-8 text-center mt-12">
            <h2 className="text-2xl font-bold text-white mb-4">Still Have Questions?</h2>
            <p className="text-text-primary/90 mb-6">
              Can't find what you're looking for? We're here to help!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/support"
                className="px-8 py-3 bg-electric-blue text-black rounded-lg font-semibold hover:bg-[#00B8E6] transition-colors"
              >
                Contact Support
              </Link>
              <Link
                href="/how-it-works"
                className="px-8 py-3 border-2 border-electric-blue text-electric-blue rounded-lg font-semibold hover:bg-electric-blue/10 transition-colors"
              >
                Learn How It Works
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}

