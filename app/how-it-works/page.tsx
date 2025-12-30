import type { Metadata } from 'next'
import Link from 'next/link'
import { getStaticPage } from '@/lib/content/static-pages'

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.argufight.com'
  let page = null
  try {
    page = await getStaticPage('how-it-works')
  } catch (error: any) {
    console.error('[HowItWorksPage] Failed to fetch static page:', error.message)
    // Use defaults if database query fails
  }
  
  const title = page?.metaTitle || 'How It Works - Argufight | AI-Judged Debate Platform'
  const description = page?.metaDescription || 'Learn how Argufight works. Create debates, make arguments over 5 rounds, get judged by 7 unique AI personalities, and climb the ELO leaderboard. Start debating today!'
  const keywords = page?.keywords || 'how debate platform works, AI judges, debate process, ELO ranking, online debates, argumentation skills'

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${baseUrl}/how-it-works`,
    },
    alternates: {
      canonical: `${baseUrl}/how-it-works`,
    },
  }
}

export default async function HowItWorksPage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.argufight.com'
  let page = null
  try {
    page = await getStaticPage('how-it-works')
  } catch (error: any) {
    console.error('[HowItWorksPage] Failed to fetch static page:', error.message)
    // Use fallback content if database query fails
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to Use Argufight Debate Platform",
    "description": "Step-by-step guide to creating and participating in AI-judged debates",
    "step": [
      {
        "@type": "HowToStep",
        "name": "Create or Accept a Debate Challenge",
        "text": "Choose a topic or accept a challenge from another user. You can debate on politics, sports, philosophy, or any topic you're passionate about.",
      },
      {
        "@type": "HowToStep",
        "name": "Make Your Arguments Over 5 Rounds",
        "text": "Present your case over 5 rounds. Use evidence, logic, and rhetoric to build a compelling argument. Each round allows you to respond to your opponent and strengthen your position.",
      },
      {
        "@type": "HowToStep",
        "name": "Get Judged by 7 AI Personalities",
        "text": "After completing all rounds, 7 unique AI judge personalities evaluate your arguments. Each judge has different perspectives and criteria, providing comprehensive feedback.",
      },
      {
        "@type": "HowToStep",
        "name": "Receive Scores and Feedback",
        "text": "Get detailed scores and feedback from each judge. Learn what worked, what didn't, and how to improve your argumentation skills.",
      },
      {
        "@type": "HowToStep",
        "name": "Climb the ELO Leaderboard",
        "text": "Win debates to earn ELO points and climb the global leaderboard. Track your progress and compete with debaters worldwide.",
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {page && page.content ? (
            // Render database content
            <div>
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  {page.title}
                </h1>
              </div>
              <div
                className="prose prose-invert prose-lg max-w-none prose-headings:text-white prose-p:text-text-primary/90 prose-a:text-electric-blue prose-strong:text-white"
                dangerouslySetInnerHTML={{ __html: page.content }}
              />
            </div>
          ) : (
            // Fallback content
            <>
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  How Argufight Works
                </h1>
                <p className="text-xl text-text-primary/80">
                  Master the art of argumentation with AI-judged debates
                </p>
              </div>

          <div className="space-y-12">
            {/* Step 1 */}
            <section className="bg-bg-secondary border border-bg-tertiary rounded-xl p-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-electric-blue text-black rounded-full flex items-center justify-center font-bold text-xl">
                  1
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Create or Accept a Debate Challenge</h2>
                  <p className="text-text-primary/90 mb-4">
                    Start by choosing a debate topic that interests you. You can create your own debate challenge on any topic - from politics and sports to philosophy and technology. Alternatively, browse open challenges from other users and accept one that catches your interest.
                  </p>
                  <p className="text-text-primary/90">
                    Each debate has a clear topic statement, category, and description. You can challenge a specific user directly or create an open challenge that anyone can accept. Once both participants are ready, the debate begins.
                  </p>
                </div>
              </div>
            </section>

            {/* Step 2 */}
            <section className="bg-bg-secondary border border-bg-tertiary rounded-xl p-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-electric-blue text-black rounded-full flex items-center justify-center font-bold text-xl">
                  2
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Make Your Arguments Over 5 Rounds</h2>
                  <p className="text-text-primary/90 mb-4">
                    The debate consists of 5 rounds where you and your opponent take turns presenting arguments. In each round, you can:
                  </p>
                  <ul className="list-disc list-inside text-text-primary/90 space-y-2 mb-4">
                    <li>Present new evidence and reasoning</li>
                    <li>Respond to your opponent's previous arguments</li>
                    <li>Strengthen your position with additional support</li>
                    <li>Address counterarguments and refute opposing points</li>
                  </ul>
                  <p className="text-text-primary/90">
                    Each round has a time limit, so you'll need to be concise and effective. Use clear logic, credible evidence, and persuasive rhetoric to make your case. The quality of your arguments matters more than their length.
                  </p>
                </div>
              </div>
            </section>

            {/* Step 3 */}
            <section className="bg-bg-secondary border border-bg-tertiary rounded-xl p-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-electric-blue text-black rounded-full flex items-center justify-center font-bold text-xl">
                  3
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Get Judged by 7 AI Personalities</h2>
                  <p className="text-text-primary/90 mb-4">
                    After all 5 rounds are complete, 7 unique AI judge personalities evaluate your debate. Each judge has a distinct perspective and evaluation criteria:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-bg-tertiary p-4 rounded-lg">
                      <h3 className="font-semibold text-electric-blue mb-2">📚 The Scholar</h3>
                      <p className="text-text-primary/80 text-sm">Values evidence and academic rigor</p>
                    </div>
                    <div className="bg-bg-tertiary p-4 rounded-lg">
                      <h3 className="font-semibold text-electric-blue mb-2">🤨 The Skeptic</h3>
                      <p className="text-text-primary/80 text-sm">Challenges every assumption</p>
                    </div>
                    <div className="bg-bg-tertiary p-4 rounded-lg">
                      <h3 className="font-semibold text-electric-blue mb-2">😈 Devil's Advocate</h3>
                      <p className="text-text-primary/80 text-sm">Plays the opposing side</p>
                    </div>
                    <div className="bg-bg-tertiary p-4 rounded-lg">
                      <h3 className="font-semibold text-electric-blue mb-2">🤔 The Philosopher</h3>
                      <p className="text-text-primary/80 text-sm">Explores deeper implications</p>
                    </div>
                    <div className="bg-bg-tertiary p-4 rounded-lg">
                      <h3 className="font-semibold text-electric-blue mb-2">❤️ The Empath</h3>
                      <p className="text-text-primary/80 text-sm">Considers human impact</p>
                    </div>
                    <div className="bg-bg-tertiary p-4 rounded-lg">
                      <h3 className="font-semibold text-electric-blue mb-2">⚖️ The Pragmatist</h3>
                      <p className="text-text-primary/80 text-sm">Focuses on practical solutions</p>
                    </div>
                    <div className="bg-bg-tertiary p-4 rounded-lg">
                      <h3 className="font-semibold text-electric-blue mb-2">📜 The Traditionalist</h3>
                      <p className="text-text-primary/80 text-sm">Values history and precedent</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Step 4 */}
            <section className="bg-bg-secondary border border-bg-tertiary rounded-xl p-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-electric-blue text-black rounded-full flex items-center justify-center font-bold text-xl">
                  4
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Receive Scores and Feedback</h2>
                  <p className="text-text-primary/90 mb-4">
                    Each judge provides detailed feedback on your performance, including:
                  </p>
                  <ul className="list-disc list-inside text-text-primary/90 space-y-2 mb-4">
                    <li>Overall score out of 100</li>
                    <li>Winner determination (if applicable)</li>
                    <li>Detailed reasoning for their decision</li>
                    <li>Strengths and weaknesses in your arguments</li>
                    <li>Suggestions for improvement</li>
                  </ul>
                  <p className="text-text-primary/90">
                    This comprehensive feedback helps you understand what makes a strong argument and how to improve your debate skills over time.
                  </p>
                </div>
              </div>
            </section>

            {/* Step 5 */}
            <section className="bg-bg-secondary border border-bg-tertiary rounded-xl p-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-electric-blue text-black rounded-full flex items-center justify-center font-bold text-xl">
                  5
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Climb the ELO Leaderboard</h2>
                  <p className="text-text-primary/90 mb-4">
                    Your debate performance affects your ELO rating, a skill-based ranking system similar to chess. When you win debates, your ELO increases. When you lose, it decreases. The amount of change depends on your opponent's ELO rating.
                  </p>
                  <p className="text-text-primary/90 mb-4">
                    Track your progress on the global leaderboard and see how you rank against other debaters. Compete in tournaments for additional recognition and prizes. Your ELO rating reflects your argumentation skills and debate experience.
                  </p>
                  <p className="text-text-primary/90">
                    The more you debate, the better you become at constructing arguments, using evidence, and thinking critically. Argufight is designed to help you improve your skills while having fun competing with others.
                  </p>
                </div>
              </div>
            </section>

            {/* CTA */}
            <section className="bg-gradient-to-r from-electric-blue/20 to-purple-600/20 border border-electric-blue/50 rounded-xl p-8 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Debating?</h2>
              <p className="text-text-primary/90 mb-6 text-lg">
                Join thousands of debaters improving their critical thinking and argumentation skills
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/signup"
                  className="px-8 py-3 bg-electric-blue text-black rounded-lg font-semibold hover:bg-[#00B8E6] transition-colors"
                >
                  Sign Up Free
                </Link>
                <Link
                  href="/leaderboard"
                  className="px-8 py-3 border-2 border-electric-blue text-electric-blue rounded-lg font-semibold hover:bg-electric-blue/10 transition-colors"
                >
                  View Leaderboard
                </Link>
              </div>
            </section>
          </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

