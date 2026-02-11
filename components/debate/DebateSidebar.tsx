'use client'

import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { LiveChat } from './LiveChat'
import { CommentsSection } from './CommentsSection'
import { AdDisplay } from '@/components/ads/AdDisplay'

interface DebateSidebarProps {
  debateId: string
  status: string
}

export function DebateSidebar({ debateId, status }: DebateSidebarProps) {
  const showChat = status === 'ACTIVE' || status === 'COMPLETED' || status === 'VERDICT_READY'

  return (
    <div className="lg:col-span-1 space-y-6">
      <AdDisplay placement="DEBATE_WIDGET" debateId={debateId} context="debate-sidebar" />

      {showChat && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-text-primary">Live Chat</h2>
            <p className="text-sm text-text-secondary mt-1">Chat with everyone watching this debate</p>
          </CardHeader>
          <CardBody className="p-0">
            <LiveChat debateId={debateId} />
          </CardBody>
        </Card>
      )}

      <Card className="h-[600px] flex flex-col">
        <CardHeader>
          <h2 className="text-xl font-bold text-text-primary">Comments</h2>
          <p className="text-sm text-text-secondary mt-1">Discuss this debate</p>
        </CardHeader>
        <CardBody className="p-0 flex-1 overflow-hidden">
          <CommentsSection debateId={debateId} />
        </CardBody>
      </Card>
    </div>
  )
}
