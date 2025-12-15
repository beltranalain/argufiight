import Link from 'next/link'
import { Card, CardBody } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { prisma } from '@/lib/db/prisma'

interface RelatedDebatesProps {
  currentDebateId: string
  category: string
  challengerId: string
  opponentId: string | null
}

export async function RelatedDebates({
  currentDebateId,
  category,
  challengerId,
  opponentId,
}: RelatedDebatesProps) {
  // Get related debates: same category, same participants, or recent debates
  const [categoryDebates, participantDebates, recentDebates] = await Promise.all([
    // Debates in same category
    prisma.debate.findMany({
      where: {
        id: { not: currentDebateId },
        category: category as any,
        visibility: 'PUBLIC',
        status: { in: ['COMPLETED', 'VERDICT_READY'] },
      },
      select: {
        id: true,
        slug: true,
        topic: true,
        category: true,
        challenger: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        opponent: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 3,
    }),
    // Debates with same participants
    prisma.debate.findMany({
      where: {
        id: { not: currentDebateId },
        visibility: 'PUBLIC',
        status: { in: ['COMPLETED', 'VERDICT_READY'] },
        OR: [
          { challengerId },
          { opponentId },
          ...(opponentId ? [{ challengerId: opponentId }, { opponentId: challengerId }] : []),
        ],
      },
      select: {
        id: true,
        slug: true,
        topic: true,
        category: true,
        challenger: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        opponent: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 2,
    }),
    // Recent debates
    prisma.debate.findMany({
      where: {
        id: { not: currentDebateId },
        visibility: 'PUBLIC',
        status: { in: ['COMPLETED', 'VERDICT_READY'] },
      },
      select: {
        id: true,
        slug: true,
        topic: true,
        category: true,
        challenger: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        opponent: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 2,
    }),
  ])

  // Combine and deduplicate
  const allDebates = [
    ...categoryDebates,
    ...participantDebates.filter(d => !categoryDebates.some(cd => cd.id === d.id)),
    ...recentDebates.filter(d => 
      !categoryDebates.some(cd => cd.id === d.id) &&
      !participantDebates.some(pd => pd.id === d.id)
    ),
  ].slice(0, 6)

  if (allDebates.length === 0) {
    return null
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-text-primary mb-6">Related Debates</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allDebates.map((debate) => (
          <Link key={debate.id} href={`/debates/${debate.slug || debate.id}`}>
            <Card className="h-full hover:border-electric-blue transition-colors">
              <CardBody>
                <h3 className="text-lg font-semibold text-text-primary mb-2 line-clamp-2">
                  {debate.topic}
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="default" className="bg-bg-secondary text-text-primary text-xs">
                    {debate.category}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Avatar
                    src={debate.challenger.avatarUrl}
                    username={debate.challenger.username}
                    size="sm"
                  />
                  <span>{debate.challenger.username}</span>
                  {debate.opponent && (
                    <>
                      <span>vs</span>
                      <Avatar
                        src={debate.opponent.avatarUrl}
                        username={debate.opponent.username}
                        size="sm"
                      />
                      <span>{debate.opponent.username}</span>
                    </>
                  )}
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
