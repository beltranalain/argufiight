'use client'

import React from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'

interface Statement {
  id: string
  round: number
  content: string
  author: {
    id: string
    username: string
    avatarUrl: string | null
  }
  createdAt: Date
}

interface StatementsTimelineProps {
  statements: Statement[]
  currentRound: number
  challengerId: string
  opponentId: string | null
  challengeType?: string
}

export const StatementsTimeline = React.memo(function StatementsTimeline({
  statements,
  currentRound,
  challengerId,
  opponentId,
  challengeType,
}: StatementsTimelineProps) {
  if (statements.length === 0) return null

  const isGroupDebate = challengeType === 'GROUP'

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-bold text-text-primary">Arguments</h2>
      </CardHeader>
      <CardBody>
        <div className="space-y-6">
          {Array.from({ length: currentRound }).map((_, roundIndex) => {
            const round = roundIndex + 1
            const roundStatements = statements.filter(s => s.round === round)

            return (
              <div key={round} className="border-b border-bg-tertiary pb-6 last:border-0">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Round {round}
                </h3>
                <div className="space-y-4">
                  {roundStatements.map((statement) => {
                    const isChallengerStatement = statement.author.id === challengerId
                    const isOpponentStatement = opponentId && statement.author.id === opponentId

                    return (
                      <div
                        key={statement.id}
                        className={`p-4 rounded-lg border ${
                          isChallengerStatement
                            ? 'bg-bg-secondary border-electric-blue/30'
                            : isOpponentStatement
                            ? 'bg-bg-tertiary border-bg-tertiary'
                            : isGroupDebate
                            ? 'bg-bg-secondary/50 border-bg-tertiary'
                            : 'bg-bg-tertiary border-bg-tertiary'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar
                            src={statement.author.avatarUrl}
                            username={statement.author.username}
                            size="sm"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-text-primary text-sm">
                                {statement.author.username}
                              </p>
                              {isGroupDebate && (
                                <Badge variant="default" size="sm">Participant</Badge>
                              )}
                            </div>
                            <p className="text-xs text-text-secondary">
                              {new Date(statement.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <p className="text-text-secondary whitespace-pre-wrap">
                          {statement.content}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </CardBody>
    </Card>
  )
})
