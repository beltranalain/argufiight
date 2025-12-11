import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About Us - Argufight | AI-Judged Debate Platform',
  description: 'Learn about Argufight, the world\'s first AI-judged debate platform. Our mission is to improve critical thinking and argumentation skills through structured debates with AI judges.',
  keywords: 'about argufight, debate platform mission, AI judges, critical thinking, argumentation skills',
  openGraph: {
    title: 'About Us - Argufight',
    description: 'Learn about Argufight and our mission to improve critical thinking through AI-judged debates.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.argufight.com/about',
  },
}

export default function AboutPage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.argufight.com'

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "About Argufight",
    "description": "AI-judged debate platform dedicated to improving critical thinking and argumentation skills",
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
              About Argufight
            </h1>
            <p className="text-xl text-text-primary/80">
              Empowering critical thinking through AI-judged debates
            </p>
          </div>

          <div className="space-y-12">
            {/* Mission */}
            <section className="bg-bg-secondary border border-bg-tertiary rounded-xl p-8">
              <h2 className="text-3xl font-bold text-white mb-4">Our Mission</h2>
              <p className="text-text-primary/90 mb-4">
                Argufight was founded with a simple but powerful mission: to make critical thinking and argumentation skills accessible to everyone. In an era of information overload and polarized discourse, we believe that structured, respectful debate is essential for personal growth and societal progress.
              </p>
              <p className="text-text-primary/90">
                We've created the world's first AI-judged debate platform where anyone can practice their argumentation skills, receive detailed feedback, and improve their ability to think critically about complex issues. Whether you're a student, professional, or lifelong learner, Argufight provides a safe space to engage with ideas and sharpen your reasoning.
              </p>
            </section>

            {/* What Makes Us Different */}
            <section className="bg-bg-secondary border border-bg-tertiary rounded-xl p-8">
              <h2 className="text-3xl font-bold text-white mb-6">What Makes Us Different</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-electric-blue mb-2">7 Unique AI Judge Personalities</h3>
                  <p className="text-text-primary/90">
                    Unlike traditional debate platforms, Argufight uses 7 distinct AI judge personalities, each with different perspectives and evaluation criteria. This ensures comprehensive feedback that considers multiple viewpoints - from academic rigor to practical solutions to human empathy.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-electric-blue mb-2">ELO Ranking System</h3>
                  <p className="text-text-primary/90">
                    Our skill-based ranking system, inspired by chess, allows you to track your progress and compete with debaters at your level. As you improve, you'll face stronger opponents and climb the global leaderboard.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-electric-blue mb-2">Structured Learning</h3>
                  <p className="text-text-primary/90">
                    Every debate provides detailed feedback on your arguments, helping you understand what works and what doesn't. Over time, you'll develop stronger reasoning, better evidence usage, and more persuasive communication skills.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-electric-blue mb-2">Accessible to Everyone</h3>
                  <p className="text-text-primary/90">
                    Argufight is free to use, with no barriers to entry. We believe that critical thinking skills should be available to everyone, regardless of their background or financial situation. Our core features will always remain free.
                  </p>
                </div>
              </div>
            </section>

            {/* Our Values */}
            <section className="bg-bg-secondary border border-bg-tertiary rounded-xl p-8">
              <h2 className="text-3xl font-bold text-white mb-6">Our Values</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-bg-tertiary p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-electric-blue mb-2">Respectful Discourse</h3>
                  <p className="text-text-primary/80 text-sm">
                    We foster an environment where ideas are challenged, not people. Respectful disagreement is encouraged, and personal attacks are not tolerated.
                  </p>
                </div>
                <div className="bg-bg-tertiary p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-electric-blue mb-2">Evidence-Based Thinking</h3>
                  <p className="text-text-primary/80 text-sm">
                    We value arguments backed by evidence, logic, and reason. Our AI judges evaluate the quality of reasoning, not just the position taken.
                  </p>
                </div>
                <div className="bg-bg-tertiary p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-electric-blue mb-2">Continuous Improvement</h3>
                  <p className="text-text-primary/80 text-sm">
                    We believe everyone can improve their critical thinking skills with practice and feedback. Our platform is designed to support your growth journey.
                  </p>
                </div>
                <div className="bg-bg-tertiary p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-electric-blue mb-2">Accessibility</h3>
                  <p className="text-text-primary/80 text-sm">
                    Critical thinking skills should be available to everyone. We're committed to keeping our core platform free and accessible to all.
                  </p>
                </div>
              </div>
            </section>

            {/* Join Us */}
            <section className="bg-gradient-to-r from-electric-blue/20 to-purple-600/20 border border-electric-blue/50 rounded-xl p-8 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">Join Our Community</h2>
              <p className="text-text-primary/90 mb-6 text-lg">
                Thousands of debaters are already improving their skills on Argufight. Join us and become part of a community dedicated to critical thinking and respectful discourse.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/signup"
                  className="px-8 py-3 bg-electric-blue text-black rounded-lg font-semibold hover:bg-[#00B8E6] transition-colors"
                >
                  Sign Up Free
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
      </div>
    </>
  )
}

