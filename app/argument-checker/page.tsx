import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Argument Checker | Argufight - Analyze and Improve Your Arguments',
  description: 'Use Argufight as an argument checker to analyze your debate arguments. Get AI feedback on logical consistency, evidence quality, and persuasive power.',
  keywords: 'argument checker, argument analyzer, logical fallacy checker, argument quality, debate argument analysis',
  openGraph: {
    title: 'Argument Checker | Argufight',
    description: 'Check and improve your arguments with AI judge feedback',
    type: 'website',
  },
}

export default function ArgumentCheckerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-indigo-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <article>
          <h1 className="text-5xl font-bold text-white mb-6">
            Argument Checker: Analyze and Improve Your Arguments
          </h1>

          <div className="prose prose-invert prose-lg max-w-none mb-12">
            <p className="text-xl text-text-primary/90 mb-6">
              Argufight functions as a powerful argument checker, providing AI-powered analysis 
              of your debate arguments to help you identify strengths, weaknesses, and areas for improvement.
            </p>

            <h2 className="text-3xl font-bold text-white mt-8 mb-4">What Our Argument Checker Analyzes</h2>
            
            <ul className="list-disc list-inside space-y-3 text-text-primary/90">
              <li><strong>Logical Consistency:</strong> Are your arguments logically sound?</li>
              <li><strong>Evidence Quality:</strong> Is your evidence credible and relevant?</li>
              <li><strong>Argument Structure:</strong> Is your argument well-organized?</li>
              <li><strong>Persuasive Power:</strong> How convincing is your argument?</li>
              <li><strong>Logical Fallacies:</strong> Are there any flaws in your reasoning?</li>
              <li><strong>Clarity:</strong> Is your argument clear and easy to understand?</li>
            </ul>

            <h3 className="text-2xl font-semibold text-white mt-6 mb-3">7 AI Judge Perspectives</h3>
            <p className="text-text-primary/90 mb-4">
              Get feedback from 7 different AI judges, each analyzing your arguments from a unique 
              perspective. This comprehensive analysis helps you understand how different audiences 
              might perceive your arguments.
            </p>

            <h3 className="text-2xl font-semibold text-white mt-6 mb-3">Detailed Feedback</h3>
            <p className="text-text-primary/90 mb-4">
              After each debate, receive detailed feedback explaining what worked well, what needs 
              improvement, and specific suggestions for strengthening your arguments.
            </p>

            <h2 className="text-3xl font-bold text-white mt-8 mb-4">How to Use Argufight as an Argument Checker</h2>
            
            <ol className="list-decimal list-inside space-y-4 text-text-primary/90">
              <li>Create a debate on any topic</li>
              <li>Submit your arguments in structured rounds</li>
              <li>Receive AI judge evaluations</li>
              <li>Review detailed feedback on your argument quality</li>
              <li>Identify logical fallacies and weaknesses</li>
              <li>Improve your arguments based on feedback</li>
            </ol>

            <h2 className="text-3xl font-bold text-white mt-8 mb-4">Benefits of Using an Argument Checker</h2>
            
            <ul className="list-disc list-inside space-y-3 text-text-primary/90">
              <li>Identify logical fallacies before important debates</li>
              <li>Improve argument structure and clarity</li>
              <li>Strengthen evidence and reasoning</li>
              <li>Get objective, unbiased feedback</li>
              <li>Practice and improve over time</li>
              <li>Learn from detailed analysis</li>
            </ul>

            <h2 className="text-3xl font-bold text-white mt-8 mb-4">Perfect For</h2>
            
            <ul className="list-disc list-inside space-y-3 text-text-primary/90">
              <li>Students preparing for debate competitions</li>
              <li>Professionals improving presentation skills</li>
              <li>Anyone wanting to strengthen their argumentation</li>
              <li>Writers and content creators</li>
              <li>Critical thinking enthusiasts</li>
            </ul>

            <div className="bg-bg-secondary border border-electric-blue/50 rounded-xl p-8 mt-12 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Start Checking Your Arguments</h3>
              <p className="text-text-secondary mb-6">
                Use Argufight as your argument checker and improve your debate skills
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

