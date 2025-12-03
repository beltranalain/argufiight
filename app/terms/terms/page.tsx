import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import { notFound } from 'next/navigation'
import { RichTextContent } from '@/components/legal/RichTextContent'
import { PublicFooter } from '@/components/homepage/PublicFooter'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Terms of Service - Honorable AI',
  description: 'Terms of Service for Honorable AI - AI-Judged Debate Platform',
}

export default async function TermsPage() {
  const page = await prisma.legalPage.findUnique({
    where: { slug: 'terms' },
  })

  if (!page || !page.isVisible) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-indigo-950 flex flex-col">
      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">{page.title}</h1>
          <RichTextContent content={page.content} />
        </div>
      </div>
      <PublicFooter />
    </div>
  )
}

