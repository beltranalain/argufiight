import type { Metadata } from 'next'
import Link from 'next/link'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Debate Practice Platform | Argufight - Improve Your Argumentation Skills',
  description: 'Practice debating on Argufight with AI judges. Improve your argumentation, critical thinking, and public speaking skills through structured debates. Free practice platform.',
  keywords: 'debate practice, argumentation practice, debate skills, critical thinking, public speaking practice, debate training',
  openGraph: {
    title: 'Debate Practice Platform | Argufight',
    description: 'Practice your debate skills with AI judges and improve your argumentation',
    type: 'website',
  },
}

export default function DebatePracticePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-indigo-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <article>
          <h1 className="text-5xl font-bold text-white mb-6">
            Practice Debating with AI Judges
          </h1>

          <div className="prose prose-invert prose-lg max-w-none mb-12">
            <p className="text-xl text-text-primary/90 mb-6">
              Improve your argumentation skills through structured debate practice on Argufight. 
              Get instant feedback from AI judges and track your progress over time.
            </p>

            <h2 className="text-3xl font-bold text-white mt-8 mb-4">Why Practice Debating?</h2>
            
            <p className="text-text-primary/90 mb-4">
              Debate practice helps you develop critical thinking, improve your ability to construct 
              logical arguments, and enhance your communication skills. Whether you're preparing for 
              a competition, improving your professional skills, or just enjoy intellectual discourse, 
              regular practice is essential.
            </p>

            <h3 className="text-2xl font-semibold text-white mt-6 mb-3">Structured Practice Sessions</h3>
            <p className="text-text-primary/90 mb-4">
              Each debate on Argufight follows a structured format with multiple rounds, giving you 
              time to develop your arguments and respond to your opponent. This format mirrors real-world 
              debate competitions and helps you build stamina and strategic thinking.
            </p>

            <h3 className="text-2xl font-semibold text-white mt-6 mb-3">AI Judge Feedback</h3>
            <p className="text-text-primary/90 mb-4">
              Receive detailed feedback from 7 unique AI judges after each debate. Each judge evaluates 
              different aspects of your argumentation, from logical consistency to persuasive power. 
              Use this feedback to identify areas for improvement.
            </p>

            <h3 className="text-2xl font-semibold text-white mt-6 mb-3">Track Your Progress</h3>
            <p className="text-text-primary/90 mb-4">
              Monitor your improvement with our ELO ranking system. As you win more debates and improve 
              your skills, your ranking increases, matching you with more challenging opponents.
            </p>

            <h2 className="text-3xl font-bold text-white mt-8 mb-4">How to Practice Effectively</h2>
            
            <ol className="list-decimal list-inside space-y-4 text-text-primary/90">
              <li>Start with topics you're familiar with to build confidence</li>
              <li>Gradually challenge yourself with more complex topics</li>
              <li>Review AI judge feedback after each debate</li>
              <li>Practice both sides of arguments to develop flexibility</li>
              <li>Participate in tournaments to test your skills under pressure</li>
              <li>Study successful debaters' strategies and techniques</li>
            </ol>

            <h2 className="text-3xl font-bold text-white mt-8 mb-4">Practice Any Topic</h2>
            
            <p className="text-text-primary/90 mb-4">
              Argufight allows you to practice debating on any topic. Choose from:
            </p>

            <ul className="list-disc list-inside space-y-3 text-text-primary/90">
              <li>Current events and politics</li>
              <li>Technology and innovation</li>
              <li>Science and ethics</li>
              <li>Sports and entertainment</li>
              <li>Philosophy and morality</li>
              <li>And many more categories</li>
            </ul>

            <div className="bg-bg-secondary border border-electric-blue/50 rounded-xl p-8 mt-12 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Start Practicing Today</h3>
              <p className="text-text-secondary mb-6">
                Join Argufight and begin improving your debate skills with AI-judged practice sessions
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

