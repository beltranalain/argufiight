import type { Metadata } from 'next'
import Link from 'next/link'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'AI Debate Platform | Argufight - Debate with Artificial Intelligence Judges',
  description: 'Experience AI-judged debates on Argufight. Our advanced AI judges provide fair, detailed feedback on your arguments. Practice with AI opponents and improve your skills.',
  keywords: 'AI debate, artificial intelligence debate, AI judges, machine learning debate, AI argumentation',
  openGraph: {
    title: 'AI Debate Platform | Argufight',
    description: 'Debate with AI judges and get intelligent feedback on your arguments',
    type: 'website',
  },
}

export default function AIDebatePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-indigo-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <article>
          <h1 className="text-5xl font-bold text-white mb-6">
            AI-Judged Debates: The Future of Argumentation
          </h1>

          <div className="prose prose-invert prose-lg max-w-none mb-12">
            <p className="text-xl text-text-primary/90 mb-6">
              Argufight uses advanced artificial intelligence to judge debates fairly and provide 
              detailed feedback. Experience the future of debate evaluation with our 7 unique AI judge personalities.
            </p>

            <h2 className="text-3xl font-bold text-white mt-8 mb-4">How AI Judges Work</h2>
            
            <p className="text-text-primary/90 mb-4">
              Our AI judges use natural language processing and machine learning to evaluate debates 
              based on multiple criteria including logical consistency, evidence quality, argument 
              structure, and persuasive power.
            </p>

            <h3 className="text-2xl font-semibold text-white mt-6 mb-3">7 Unique AI Personalities</h3>
            <p className="text-text-primary/90 mb-4">
              Each AI judge has a distinct personality and evaluation style:
            </p>

            <ul className="list-disc list-inside space-y-3 text-text-primary/90">
              <li><strong>Analytical Judge:</strong> Values logic and evidence above all</li>
              <li><strong>Balanced Judge:</strong> Seeks fairness and considers all perspectives</li>
              <li><strong>Witty Judge:</strong> Appreciates clever arguments and humor</li>
              <li><strong>Strict Judge:</strong> Demands high standards and precision</li>
              <li><strong>Empathetic Judge:</strong> Considers emotional and human elements</li>
              <li><strong>Technical Judge:</strong> Focuses on factual accuracy and detail</li>
              <li><strong>Creative Judge:</strong> Values innovation and unique perspectives</li>
            </ul>

            <h3 className="text-2xl font-semibold text-white mt-6 mb-3">Fair and Unbiased Evaluation</h3>
            <p className="text-text-primary/90 mb-4">
              AI judges eliminate human bias and provide consistent, objective evaluations. They analyze 
              arguments based on merit alone, ensuring fair competition for all debaters.
            </p>

            <h3 className="text-2xl font-semibold text-white mt-6 mb-3">Detailed Feedback</h3>
            <p className="text-text-primary/90 mb-4">
              After each debate, AI judges provide comprehensive feedback explaining their decisions. 
              Learn what worked, what didn't, and how to improve your argumentation skills.
            </p>

            <h2 className="text-3xl font-bold text-white mt-8 mb-4">Benefits of AI-Judged Debates</h2>
            
            <ul className="list-disc list-inside space-y-3 text-text-primary/90">
              <li>Instant, consistent evaluation</li>
              <li>No human bias or subjectivity</li>
              <li>Available 24/7 for practice</li>
              <li>Detailed feedback on argument quality</li>
              <li>Multiple judge perspectives</li>
              <li>Scalable to any number of debates</li>
            </ul>

            <h2 className="text-3xl font-bold text-white mt-8 mb-4">The Technology Behind It</h2>
            
            <p className="text-text-primary/90 mb-4">
              Our AI judges use state-of-the-art language models trained on debate evaluation criteria. 
              They understand argument structure, logical fallacies, evidence quality, and persuasive 
              techniques to provide accurate assessments.
            </p>

            <div className="bg-bg-secondary border border-electric-blue/50 rounded-xl p-8 mt-12 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Experience AI-Judged Debates</h3>
              <p className="text-text-secondary mb-6">
                Join Argufight and debate with our advanced AI judges
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

