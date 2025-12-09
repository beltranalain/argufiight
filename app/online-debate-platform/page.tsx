import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Online Debate Platform | Argufight - AI-Judged Debates',
  description: 'Join Argufight, the premier online debate platform with AI judges. Practice your argumentation skills, compete in tournaments, and climb the ELO leaderboard. Free to start!',
  keywords: 'online debate platform, debate practice, argumentation skills, AI judges, debate competition, ELO ranking',
  openGraph: {
    title: 'Online Debate Platform | Argufight',
    description: 'Practice and compete in debates with AI judges on Argufight',
    type: 'website',
  },
}

export default function OnlineDebatePlatformPage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.argufight.com'

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-indigo-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <article>
          <h1 className="text-5xl font-bold text-white mb-6">
            The Best Online Debate Platform for Argumentation Practice
          </h1>

          <div className="prose prose-invert prose-lg max-w-none mb-12">
            <p className="text-xl text-text-primary/90 mb-6">
              Argufight is the premier online debate platform where you can practice your argumentation skills, 
              compete in tournaments, and improve your critical thinking with AI-judged debates.
            </p>

            <h2 className="text-3xl font-bold text-white mt-8 mb-4">Why Choose Argufight?</h2>
            
            <h3 className="text-2xl font-semibold text-white mt-6 mb-3">7 Unique AI Judges</h3>
            <p className="text-text-primary/90 mb-4">
              Our platform features 7 distinct AI judge personalities, each with their own evaluation style. 
              From the analytical judge who values logic to the witty judge who appreciates clever arguments, 
              you'll get diverse feedback on your debate performance.
            </p>

            <h3 className="text-2xl font-semibold text-white mt-6 mb-3">ELO Ranking System</h3>
            <p className="text-text-primary/90 mb-4">
              Track your progress with our ELO ranking system. Win debates to climb the leaderboard and 
              prove your argumentation skills. Compete against opponents of similar skill levels for 
              fair and challenging matches.
            </p>

            <h3 className="text-2xl font-semibold text-white mt-6 mb-3">Tournament Mode</h3>
            <p className="text-text-primary/90 mb-4">
              Participate in tournaments with various formats including King of the Hill, Championship, 
              and more. Test your skills against multiple opponents and compete for the top spot.
            </p>

            <h3 className="text-2xl font-semibold text-white mt-6 mb-3">Free to Start</h3>
            <p className="text-text-primary/90 mb-4">
              Get started for free! Create debates on any topic, challenge opponents, and improve your 
              argumentation skills without any upfront cost.
            </p>

            <h2 className="text-3xl font-bold text-white mt-8 mb-4">How It Works</h2>
            
            <ol className="list-decimal list-inside space-y-4 text-text-primary/90">
              <li>Create a debate on any topic you're passionate about</li>
              <li>Choose your position (FOR or AGAINST)</li>
              <li>Wait for an opponent or challenge someone directly</li>
              <li>Submit your arguments in multiple rounds</li>
              <li>Receive AI judge verdicts with detailed feedback</li>
              <li>Climb the ELO leaderboard as you improve</li>
            </ol>

            <h2 className="text-3xl font-bold text-white mt-8 mb-4">Perfect For</h2>
            
            <ul className="list-disc list-inside space-y-3 text-text-primary/90">
              <li>Students practicing for debate competitions</li>
              <li>Professionals improving their argumentation skills</li>
              <li>Anyone interested in critical thinking and logical reasoning</li>
              <li>Debate enthusiasts looking for a competitive platform</li>
            </ul>

            <div className="bg-bg-secondary border border-electric-blue/50 rounded-xl p-8 mt-12 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Ready to Start Debating?</h3>
              <p className="text-text-secondary mb-6">
                Join thousands of users improving their argumentation skills on Argufight
              </p>
              <Link
                href="/signup"
                className="inline-block px-8 py-4 bg-electric-blue text-black rounded-lg font-semibold text-lg hover:bg-[#00B8E6] transition-colors"
              >
                Sign Up Free
              </Link>
            </div>

            <h2 className="text-3xl font-bold text-white mt-8 mb-4">Frequently Asked Questions</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Is Argufight really free?</h3>
                <p className="text-text-primary/90">
                  Yes! You can create debates, challenge opponents, and participate in tournaments for free. 
                  We offer premium features for advanced users, but the core platform is completely free.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-2">How do AI judges work?</h3>
                <p className="text-text-primary/90">
                  Our AI judges evaluate debates based on logic, evidence, clarity, and argumentation quality. 
                  Each judge has a unique personality and evaluation style, providing diverse feedback on your performance.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Can I debate any topic?</h3>
                <p className="text-text-primary/90">
                  Yes! You can create debates on any topic you're interested in. From politics to sports, 
                  technology to entertainment, the choice is yours.
                </p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}

