import type { Metadata } from 'next'
import Link from 'next/link'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Debate Simulator | Argufight - Practice Debates Online',
  description: 'Use Argufight as a debate simulator to practice your argumentation skills. Simulate real debate scenarios with AI judges and improve your performance.',
  keywords: 'debate simulator, debate practice tool, argumentation simulator, debate training, online debate practice',
  openGraph: {
    title: 'Debate Simulator | Argufight',
    description: 'Practice debates with our realistic debate simulator and AI judges',
    type: 'website',
  },
}

export default function DebateSimulatorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-indigo-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <article>
          <h1 className="text-5xl font-bold text-white mb-6">
            Debate Simulator: Practice Real Debate Scenarios
          </h1>

          <div className="prose prose-invert prose-lg max-w-none mb-12">
            <p className="text-xl text-text-primary/90 mb-6">
              Argufight functions as a comprehensive debate simulator, allowing you to practice 
              real debate scenarios with structured rounds, time limits, and AI judge evaluation.
            </p>

            <h2 className="text-3xl font-bold text-white mt-8 mb-4">Realistic Debate Simulation</h2>
            
            <p className="text-text-primary/90 mb-4">
              Our platform simulates real debate competitions with:
            </p>

            <ul className="list-disc list-inside space-y-3 text-text-primary/90">
              <li>Multiple rounds with time limits</li>
              <li>Structured argument submission</li>
              <li>Opponent responses and rebuttals</li>
              <li>AI judge evaluation</li>
              <li>Tournament-style competition</li>
              <li>ELO ranking system</li>
            </ul>

            <h3 className="text-2xl font-semibold text-white mt-6 mb-3">Practice Different Formats</h3>
            <p className="text-text-primary/90 mb-4">
              Simulate various debate formats including traditional one-on-one debates, speed debates, 
              and tournament formats like Championship brackets.
            </p>

            <h3 className="text-2xl font-semibold text-white mt-6 mb-3">Track Your Performance</h3>
            <p className="text-text-primary/90 mb-4">
              Monitor your improvement over time with detailed statistics, win rates, and ELO progression. 
              Use the simulator to identify weaknesses and focus your practice.
            </p>

            <h2 className="text-3xl font-bold text-white mt-8 mb-4">Perfect for Preparation</h2>
            
            <p className="text-text-primary/90 mb-4">
              Whether you're preparing for a debate competition, improving your professional argumentation 
              skills, or just want to practice, our debate simulator provides a realistic environment to hone your abilities.
            </p>

            <h2 className="text-3xl font-bold text-white mt-8 mb-4">Features of Our Simulator</h2>
            
            <ul className="list-disc list-inside space-y-3 text-text-primary/90">
              <li>Real-time debate rounds with deadlines</li>
              <li>Multiple AI judge evaluations</li>
              <li>Detailed feedback and analysis</li>
              <li>Tournament simulation</li>
              <li>Practice against real opponents or AI</li>
              <li>Historical debate review</li>
            </ul>

            <div className="bg-bg-secondary border border-electric-blue/50 rounded-xl p-8 mt-12 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Start Simulating Debates</h3>
              <p className="text-text-secondary mb-6">
                Use Argufight as your debate simulator and improve your skills
              </p>
              <Link
                href="/signup"
                className="inline-block px-8 py-4 bg-electric-blue text-black rounded-lg font-semibold text-lg hover:bg-[#00B8E6] transition-colors"
              >
                Sign Up Free
              </Link>
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}

