'use client'

import { Avatar } from '@/components/ui/Avatar'
import type { Conversation } from '@/lib/hooks/queries/useMessages'

interface ConversationListProps {
  conversations: Conversation[]
  selectedId: string | undefined
  onSelect: (conversation: Conversation) => void
}

export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-text-secondary">
        <p>No conversations yet</p>
        <p className="text-sm mt-2">Start a conversation from Following or New Message</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-bg-tertiary">
      {conversations.map((conv) => (
        <button
          key={conv.id}
          onClick={() => onSelect(conv)}
          className={`w-full p-4 text-left hover:bg-bg-secondary transition-colors ${
            selectedId === conv.id ? 'bg-bg-secondary' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <Avatar
              src={conv.otherUser.avatarUrl}
              username={conv.otherUser.username}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-white truncate">
                  {conv.otherUser.username}
                </p>
                {conv.unreadCount > 0 && (
                  <span className="bg-electric-blue text-black text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
              {conv.messages.length > 0 && (
                <p className="text-sm text-text-secondary truncate">
                  {conv.messages[0].content}
                </p>
              )}
              {conv.lastMessageAt && (
                <p className="text-xs text-text-muted mt-1">
                  {new Date(conv.lastMessageAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
