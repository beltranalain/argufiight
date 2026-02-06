import { prisma } from '@/lib/db/prisma'

export const revalidate = 3600 // Revalidate every hour

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.argufight.com'

  const [debates, blogPosts] = await Promise.all([
    prisma.debate.findMany({
      where: {
        visibility: 'PUBLIC',
        status: { in: ['COMPLETED', 'ACTIVE'] },
      },
      select: {
        id: true,
        slug: true,
        topic: true,
        description: true,
        category: true,
        updatedAt: true,
        challenger: { select: { username: true } },
        opponent: { select: { username: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    }),
    prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: { lte: new Date() },
      },
      select: {
        slug: true,
        title: true,
        excerpt: true,
        publishedAt: true,
        updatedAt: true,
      },
      orderBy: { publishedAt: 'desc' },
      take: 20,
    }),
  ])

  const escapeXml = (str: string) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const debateItems = debates.map(d => {
    const desc = d.description
      ? escapeXml(d.description)
      : `${escapeXml(d.challenger.username)} vs ${escapeXml(d.opponent?.username || 'TBD')} debate on ${escapeXml(d.topic)}`
    return `    <item>
      <title><![CDATA[${d.topic}]]></title>
      <link>${baseUrl}/debates/${d.slug || d.id}</link>
      <guid isPermaLink="true">${baseUrl}/debates/${d.slug || d.id}</guid>
      <description>${desc}</description>
      <category>${escapeXml(d.category)}</category>
      <pubDate>${new Date(d.updatedAt).toUTCString()}</pubDate>
    </item>`
  }).join('\n')

  const blogItems = blogPosts.map(p => {
    const desc = p.excerpt ? escapeXml(p.excerpt) : escapeXml(p.title)
    return `    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${baseUrl}/blog/${p.slug}</link>
      <guid isPermaLink="true">${baseUrl}/blog/${p.slug}</guid>
      <description>${desc}</description>
      <category>Blog</category>
      <pubDate>${new Date(p.publishedAt || p.updatedAt).toUTCString()}</pubDate>
    </item>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>ArguFight - AI-Judged Debate Platform</title>
    <link>${baseUrl}</link>
    <description>The world's first debate platform with AI judges. Latest debates and articles.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
${debateItems}
${blogItems}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
