import { prisma } from '@/lib/db/prisma'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import Link from 'next/link'

export default async function AdminModerationPage() {
  // Get flagged statements and reports
  const [flaggedStatements, reports] = await Promise.all([
    prisma.statement.findMany({
      where: { flagged: true },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          }
        },
        debate: {
          select: {
            id: true,
            topic: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.report.findMany({
      where: { 
        OR: [
          { status: 'PENDING' },
          { status: 'REVIEWING' }, // Include items in review
        ]
      },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
          }
        },
        debate: {
          select: {
            id: true,
            topic: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ])

  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-2">Moderation Queue</h1>
      <p className="text-text-secondary mb-8">Review flagged content and user reports</p>

      <div className="space-y-6">
        {/* Reports */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Pending Reports</h2>
              {reports.length > 0 && (
                <Badge variant="default" size="sm" className="bg-neon-orange text-black">
                  {reports.length} pending
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardBody>
            {reports.length === 0 ? (
              <EmptyState
                icon={
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                title="No Pending Reports"
                description="All reports have been reviewed"
              />
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="p-4 bg-bg-tertiary rounded-lg border border-bg-tertiary"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="default" size="sm">
                            {report.status}
                          </Badge>
                          {report.aiModerated && (
                            <>
                              <Badge 
                                variant="default" 
                                size="sm" 
                                className={
                                  report.aiAction === 'APPROVE' 
                                    ? 'bg-cyber-green text-black'
                                    : report.aiAction === 'REMOVE'
                                    ? 'bg-neon-orange text-black'
                                    : 'bg-electric-blue text-black'
                                }
                              >
                                AI: {report.aiAction}
                              </Badge>
                              {report.aiConfidence && (
                                <Badge variant="default" size="sm" className="bg-hot-pink text-black">
                                  {report.aiConfidence}% confidence
                                </Badge>
                              )}
                            </>
                          )}
                          <span className="text-sm text-text-secondary">
                            Reported by {report.reporter.username}
                          </span>
                        </div>
                        <p className="text-white font-semibold mb-1">{report.reason}</p>
                        {report.aiReasoning && (
                          <p className="text-sm text-text-secondary mb-2 italic">
                            AI Reasoning: {report.aiReasoning}
                          </p>
                        )}
                        {report.debate && (
                          <Link 
                            href={`/debate/${report.debate.id}`}
                            className="text-sm text-electric-blue hover:text-neon-orange"
                          >
                            View Debate: {report.debate.topic}
                          </Link>
                        )}
                      </div>
                      <div className="text-sm text-text-secondary">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="primary" className="text-sm py-1.5 px-3">
                        Review
                      </Button>
                      <Button variant="ghost" className="text-sm py-1.5 px-3">
                        Dismiss
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Flagged Statements */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Flagged Statements</h2>
              {flaggedStatements.length > 0 && (
                <Badge variant="default" size="sm" className="bg-neon-orange text-black">
                  {flaggedStatements.length} flagged
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardBody>
            {flaggedStatements.length === 0 ? (
              <EmptyState
                icon={
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                title="No Flagged Statements"
                description="All statements are clean"
              />
            ) : (
              <div className="space-y-4">
                {flaggedStatements.map((statement) => (
                  <div
                    key={statement.id}
                    className="p-4 bg-bg-tertiary rounded-lg border border-bg-tertiary"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="default" size="sm" className="bg-neon-orange text-black">
                            Flagged
                          </Badge>
                          {statement.aiModerated && (
                            <>
                              <Badge 
                                variant="default" 
                                size="sm" 
                                className={
                                  statement.aiAction === 'APPROVE' 
                                    ? 'bg-cyber-green text-black'
                                    : statement.aiAction === 'REMOVE'
                                    ? 'bg-neon-orange text-black'
                                    : 'bg-electric-blue text-black'
                                }
                              >
                                AI: {statement.aiAction}
                              </Badge>
                              {statement.aiConfidence && (
                                <Badge variant="default" size="sm" className="bg-hot-pink text-black">
                                  {statement.aiConfidence}% confidence
                                </Badge>
                              )}
                            </>
                          )}
                          <span className="text-sm text-text-secondary">
                            By {statement.author.username}
                          </span>
                        </div>
                        {statement.flaggedReason && (
                          <p className="text-sm text-neon-orange mb-2">
                            Reason: {statement.flaggedReason}
                          </p>
                        )}
                        {statement.aiReasoning && (
                          <p className="text-sm text-text-secondary mb-2 italic">
                            AI Reasoning: {statement.aiReasoning}
                          </p>
                        )}
                        <p className="text-white mb-2">{statement.content}</p>
                        {statement.debate && (
                          <Link 
                            href={`/debate/${statement.debate.id}`}
                            className="text-sm text-electric-blue hover:text-neon-orange"
                          >
                            View Debate: {statement.debate.topic}
                          </Link>
                        )}
                      </div>
                      <div className="text-sm text-text-secondary">
                        {new Date(statement.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="primary" className="text-sm py-1.5 px-3">
                        Approve
                      </Button>
                      <Button variant="ghost" className="text-sm py-1.5 px-3">
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

