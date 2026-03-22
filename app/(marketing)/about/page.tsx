import type { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import { Swords, Trophy, Zap, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { JsonLd, createWebPageJsonLd, createFAQJsonLd } from '@/components/seo/json-ld'

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about ArguFight — the world\'s first AI-judged debate platform. Discover how our AI judges evaluate logic, facts, and rhetoric to deliver fair verdicts in competitive online debates.',
  alternates: { canonical: '/about' },
}

async function getPage() {
  try {
    return await prisma.staticPage.findUnique({ where: { slug: 'about' } })
  } catch {
    return null
  }
}

const VALUES = [
  { icon: <Swords size={20} />, title: 'Fair Competition', desc: 'Every debate is judged by AI — no bias, no favorites. The best argument always wins.' },
  { icon: <Trophy size={20} />, title: 'Excellence', desc: 'We reward mastery. Championship belts, ELO rankings, and leaderboards celebrate the best debaters.' },
  { icon: <Zap size={20} />, title: 'Speed & Precision', desc: 'Tight character limits force clarity. Great debaters say more with less.' },
  { icon: <Shield size={20} />, title: 'Integrity', desc: 'AI judges evaluate logic, facts, and rhetoric — not emotion or who yells loudest.' },
]

const FAQ = [
  { question: 'What is ArguFight?', answer: 'ArguFight is the world\'s first AI-judged competitive debate platform where users challenge each other to structured debates evaluated by three AI judges on facts, logic, and persuasion.' },
  { question: 'How does AI judging work?', answer: 'Three AI judges — the Empiricist, the Logician, and the Rhetorician — each score debates on a 0–100 scale. The Empiricist checks factual accuracy, the Logician evaluates reasoning and identifies fallacies, and the Rhetorician measures persuasive effectiveness. The majority vote determines the winner.' },
  { question: 'Is ArguFight free to use?', answer: 'Yes, ArguFight is free to join and start debating. You can create challenges, compete in debates, and climb the ELO leaderboard at no cost.' },
  { question: 'What are championship belts?', answer: 'Championship belts are special titles awarded to top debaters in categories like Sports, Politics, Tech, Science, and more. You earn a belt by challenging and defeating the current holder. If you stop competing, you risk losing your belt to a challenger.' },
]

export default async function AboutPage() {
  const page = await getPage()

  return (
    <>
      <JsonLd data={createWebPageJsonLd({
        name: 'About ArguFight',
        description: 'Learn about ArguFight — the world\'s first AI-judged debate platform.',
        path: '/about',
      })} />
      <JsonLd data={createFAQJsonLd(FAQ)} />

      <div className="max-w-3xl mx-auto px-6 py-16">

        {/* Hero */}
        <div className="mb-16">
          <p className="text-[13px] font-[500] text-accent uppercase tracking-widest mb-4">About ArguFight</p>
          <h1 className="text-[48px] font-[700] tracking-[-2px] text-text mb-6 leading-tight">
            {page?.title ?? 'The arena for serious debate.'}
          </h1>
          {page?.content ? (
            <div
              className="prose prose-sm max-w-none text-text-2 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          ) : (
            <div className="space-y-4 text-[17px] text-text-2 leading-relaxed">
              <p>
                ArguFight was built on a simple idea: the best argument should win, not the loudest voice.
                We created the world&apos;s first AI-judged debate platform so that anyone, anywhere, can
                compete on a level playing field.
              </p>
              <p>
                Our AI judges — the Empiricist, the Logician, and the Rhetorician — evaluate every debate
                on facts, logic, and persuasion. They don&apos;t care about your follower count. They care
                about your argument.
              </p>
              <p>
                From casual debates to championship belt defenses, ArguFight is where arguments are tested,
                skills are sharpened, and legends are made.
              </p>
              <p>
                Whether you&apos;re a seasoned debater looking for a competitive edge or a newcomer wanting
                to sharpen your argumentation skills, ArguFight provides the tools and community you need.
                Our ELO ranking system ensures you&apos;re matched against opponents of similar skill, while
                tournaments offer high-stakes bracket competitions with prizes and prestige.
              </p>
            </div>
          )}
        </div>

        {/* Values */}
        <div className="mb-16">
          <h2 className="text-[24px] font-[600] text-text mb-8 tracking-tight">What we stand for</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {VALUES.map(v => (
              <div key={v.title} className="bg-surface border border-border rounded-xl p-6">
                <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4">
                  {v.icon}
                </div>
                <h3 className="text-[16px] font-[600] text-text mb-2">{v.title}</h3>
                <p className="text-[14px] text-text-3 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-surface border border-border rounded-2xl p-8 mb-16">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-[36px] font-[200] text-text">50K+</p>
              <p className="text-[14px] text-text-3 mt-1">Debates completed</p>
            </div>
            <div>
              <p className="text-[36px] font-[200] text-text">12K+</p>
              <p className="text-[14px] text-text-3 mt-1">Active debaters</p>
            </div>
            <div>
              <p className="text-[36px] font-[200] text-text">340+</p>
              <p className="text-[14px] text-text-3 mt-1">Championship belts</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="text-[24px] font-[600] text-text mb-8 tracking-tight">Frequently asked questions</h2>
          <div className="space-y-4">
            {FAQ.map(q => (
              <div key={q.question} className="bg-surface border border-border rounded-xl p-6">
                <h3 className="text-[15px] font-[500] text-text mb-2">{q.question}</h3>
                <p className="text-[14px] text-text-3 leading-relaxed">{q.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-[28px] font-[600] text-text mb-3">Ready to prove yourself?</h2>
          <p className="text-[16px] text-text-3 mb-6">Join thousands of debaters competing for ELO, belts, and respect.</p>
          <Button variant="accent" size="lg" href="/signup">Join ArguFight</Button>
        </div>

      </div>
    </>
  )
}
