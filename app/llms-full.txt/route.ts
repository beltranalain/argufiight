import { prisma } from '@/lib/db/prisma'

export const revalidate = 86400 // Revalidate daily

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.argufight.com'

  const [debateCount, userCount, recentDebates, topUsers] = await Promise.all([
    prisma.debate.count({
      where: { visibility: 'PUBLIC', status: 'COMPLETED' },
    }),
    prisma.user.count({
      where: { isAI: false },
    }),
    prisma.debate.findMany({
      where: { visibility: 'PUBLIC', status: { in: ['COMPLETED', 'ACTIVE'] } },
      select: {
        topic: true,
        slug: true,
        id: true,
        category: true,
        challenger: { select: { username: true } },
        opponent: { select: { username: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    }),
    prisma.user.findMany({
      where: { isAI: false },
      select: { username: true, eloRating: true, debatesWon: true },
      orderBy: { eloRating: 'desc' },
      take: 10,
    }),
  ])

  const debateList = recentDebates
    .map(
      (d) =>
        `- [${d.topic}](${baseUrl}/debates/${d.slug || d.id}) (${d.category}) - ${d.challenger.username} vs ${d.opponent?.username || 'TBD'}`
    )
    .join('\n')

  const leaderboard = topUsers
    .map((u, i) => `${i + 1}. ${u.username} - ELO: ${u.eloRating}, Wins: ${u.debatesWon}`)
    .join('\n')

  const content = `# ArguFight - Complete Platform Guide

> The world's first AI-judged debate platform where users compete in structured arguments across 7 categories, judged by 7 unique AI personalities, with ELO rankings and tournaments.

## Platform Statistics

- ${debateCount} public debates completed
- ${userCount} registered debaters
- 7 debate categories: Sports, Politics, Tech, Entertainment, Science, Music, Other
- 7 unique AI judge personalities per debate
- ELO-based ranking system (starting at 1200)

## Recent Debates

${debateList}

## Top Debaters

${leaderboard}

## How Debates Work

1. A challenger creates a debate on a topic, choosing a category and position (FOR or AGAINST)
2. An opponent accepts the challenge and takes the opposing position
3. Both participants submit arguments across 5 rounds
4. 7 AI judges with unique personalities score each round (0-100 per judge)
5. The winner is determined by majority vote and total score
6. ELO ratings are updated based on the outcome

## Key Features

- Structured 5-round debates with timed rounds
- AI judging with detailed feedback and scores (0-100 per judge)
- ELO rating system for competitive ranking (starting at 1200)
- Tournament brackets (single elimination, round robin)
- Belt system for category champions
- Live chat during debates
- Appeal system for disputed verdicts
- Free and Pro subscription tiers

## Frequently Asked Questions

### What is ArguFight?
ArguFight is an online debate platform where users can engage in structured debates that are judged by AI. Each debate has 5 rounds, and 7 different AI judges evaluate the arguments.

### How does the AI judging work?
Seven AI judges, each with a unique personality and judging style, independently score each participant's arguments on a scale of 0-100. The winner is determined by majority vote among the judges.

### What is the ELO rating system?
ArguFight uses an ELO rating system similar to chess. Every debater starts at 1200 ELO. Winning against higher-rated opponents earns more points, and losing to lower-rated opponents costs more.

### What are debate categories?
Debates are organized into 7 categories: Sports, Politics, Tech, Entertainment, Science, Music, and Other. Each category has its own belt champion.

### Are debates public?
Debaters can choose to make debates public (visible to everyone), unlisted (accessible via link), or private (visible only to participants).

## Content Links

- Homepage: ${baseUrl}
- Browse Debates: ${baseUrl}/debates
- Leaderboard: ${baseUrl}/leaderboard
- Topics: ${baseUrl}/topics
- Tournaments: ${baseUrl}/tournaments
- Blog: ${baseUrl}/blog
- FAQ: ${baseUrl}/faq
- How It Works: ${baseUrl}/how-it-works
- Sitemap: ${baseUrl}/sitemap.xml
- RSS Feed: ${baseUrl}/feed.xml
`

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
