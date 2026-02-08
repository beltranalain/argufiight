import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'

export const revalidate = 3600
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.argufight.com'
  
  return {
    title: 'Debate Topics - Browse by Category | Argu Fight',
    description: 'Explore debates by topic: Politics, Sports, Technology, Science, Entertainment, and more. Find debates that interest you and join the conversation.',
    keywords: 'debate topics, debate categories, political debates, sports debates, tech debates, science debates, entertainment debates',
    openGraph: {
      title: 'Debate Topics - Browse by Category | Argu Fight',
      description: 'Explore debates organized by topic category on Argu Fight',
      type: 'website',
      url: `${baseUrl}/topics`,
    },
    alternates: {
      canonical: `${baseUrl}/topics`,
    },
  }
}

export default async function TopicsPage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.argufight.com'
  
  // Get all active categories with debate counts
  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      sortOrder: 'asc',
    },
    // Note: Category model doesn't have direct relation to Debate
    // We'll calculate counts separately
  })

  // Get category stats (total debates per category)
  const categoryStats = await Promise.all(
    categories.map(async (category) => {
      const [total, active, completed] = await Promise.all([
        prisma.debate.count({
          where: {
            category: category.name as any,
            visibility: 'PUBLIC',
          },
        }),
        prisma.debate.count({
          where: {
            category: category.name as any,
            visibility: 'PUBLIC',
            status: 'ACTIVE',
          },
        }),
        prisma.debate.count({
          where: {
            category: category.name as any,
            visibility: 'PUBLIC',
            status: { in: ['COMPLETED', 'VERDICT_READY'] },
          },
        }),
      ])

      return {
        ...category,
        totalDebates: total,
        activeDebates: active,
        completedDebates: completed,
      }
    })
  )

  // ItemList schema for SEO
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Debate Topics by Category",
    "description": "Browse debates organized by topic category on Argu Fight",
    "itemListElement": categoryStats.map((category, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Category",
        "name": category.label,
        "description": category.description || `Browse ${category.totalDebates} debates in ${category.label}`,
        "url": `${baseUrl}/debates?category=${category.name}`,
      }
    }))
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="pt-20 px-4 md:px-8 pb-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Schema markup */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
          />

          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Topics', href: '/topics' },
            ]}
          />

          <div className="mb-8">
            <h1 className="text-4xl font-bold text-text-primary mb-2">Debate Topics</h1>
            <p className="text-lg text-text-secondary">
              Explore debates organized by category. Find topics that interest you and join the conversation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryStats.map((category) => (
              <Link
                key={category.id}
                href={`/debates?category=${category.name}`}
                className="block"
              >
                <Card className="h-full hover:border-electric-blue transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-2xl font-bold text-text-primary">
                        {category.icon && <span className="mr-2">{category.icon}</span>}
                        {category.label}
                      </h2>
                      {category.color && (
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                      )}
                    </div>
                    {category.description && (
                      <p className="text-sm text-text-secondary">{category.description}</p>
                    )}
                  </CardHeader>
                  <CardBody>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-text-secondary">Total:</span>
                          <span className="ml-2 font-semibold text-text-primary">{category.totalDebates}</span>
                        </div>
                        <div>
                          <span className="text-text-secondary">Active:</span>
                          <span className="ml-2 font-semibold text-electric-blue">{category.activeDebates}</span>
                        </div>
                        <div>
                          <span className="text-text-secondary">Completed:</span>
                          <span className="ml-2 font-semibold text-cyber-green">{category.completedDebates}</span>
                        </div>
                      </div>
                      <div className="pt-2">
                        <Badge variant="default" className="bg-electric-blue text-black">
                          Browse Debates →
                        </Badge>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>

          {categoryStats.length === 0 && (
            <Card>
              <CardBody>
                <p className="text-text-secondary text-center py-8">
                  No categories available yet. Check back soon!
                </p>
              </CardBody>
            </Card>
          )}

          <div className="mt-8 p-6 bg-bg-tertiary rounded-xl">
            <h3 className="text-xl font-semibold text-text-primary mb-3">Popular Topics</h3>
            <p className="text-text-secondary mb-4">
              Can't decide? Check out the most popular debate topics:
            </p>
            <div className="flex flex-wrap gap-2">
              {categoryStats
                .sort((a, b) => b.totalDebates - a.totalDebates)
                .slice(0, 6)
                .map((category) => (
                  <Link
                    key={category.id}
                    href={`/debates?category=${category.name}`}
                    className="px-4 py-2 bg-bg-secondary hover:bg-electric-blue hover:text-black rounded-lg transition-colors text-sm font-medium"
                  >
                    {category.label} ({category.totalDebates})
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
