'use client'

import { useState, useCallback } from 'react'
import { Card, CardBody } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useAuth } from '@/lib/hooks/useAuth'
import { TopNav } from '@/components/layout/TopNav'
import { useConversations } from '@/lib/hooks/queries/useMessages'
import { useStartConversation } from '@/lib/hooks/mutations/useSendMessage'
import { ConversationList } from '@/components/messages/ConversationList'
import { MessageThread } from '@/components/messages/MessageThread'
import { UserSearch } from '@/components/messages/UserSearch'
import { FollowingList } from '@/components/messages/FollowingList'
import type { Conversation } from '@/lib/hooks/queries/useMessages'

type ViewMode = 'conversations' | 'following' | 'new'

export default function MessagesPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('conversations')

  const { data: conversations = [], isLoading } = useConversations()
  const startConversation = useStartConversation()

  const handleOpenConversation = useCallback((conv: Conversation) => {
    setSelectedConversation(conv)
    setViewMode('conversations')
  }, [])

  const handleStartConversation = useCallback((otherUserId: string) => {
    startConversation.mutate(
      { otherUserId },
      {
        onSuccess: (data) => {
          const conv = data.conversation
          const otherUser = conv.user1Id === user?.id ? conv.user2 : conv.user1
          setSelectedConversation({
            ...conv,
            otherUser,
            unreadCount: 0,
            messages: [],
          })
          setViewMode('conversations')
          showToast({
            type: 'success',
            title: 'Conversation started',
            description: `You can now message ${otherUser.username}`,
          })
        },
        onError: (error: any) => {
          showToast({
            type: 'error',
            title: 'Error',
            description: error.message || 'Failed to start conversation',
          })
        },
      }
    )
  }, [startConversation, user?.id, showToast])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="THE ARENA" />
        <div className="pt-20 pb-20 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="THE ARENA" />
      <div className="pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Direct Messages</h1>
            <p className="text-text-secondary">Chat with other users</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-12rem)]">
            {/* Left Sidebar */}
            <Card className="lg:col-span-1 overflow-hidden flex flex-col">
              {/* Tabs */}
              <div className="border-b border-bg-tertiary flex">
                {(['conversations', 'following', 'new'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                      viewMode === mode
                        ? 'bg-bg-secondary text-white border-b-2 border-electric-blue'
                        : 'text-text-secondary hover:text-white hover:bg-bg-secondary'
                    }`}
                  >
                    {mode === 'conversations' ? 'Conversations' : mode === 'following' ? 'Following' : 'New Message'}
                  </button>
                ))}
              </div>

              <CardBody className="flex-1 overflow-y-auto p-0">
                {viewMode === 'conversations' && (
                  <ConversationList
                    conversations={conversations}
                    selectedId={selectedConversation?.id}
                    onSelect={handleOpenConversation}
                  />
                )}

                {viewMode === 'following' && user && (
                  <FollowingList
                    userId={user.id}
                    conversations={conversations}
                    onOpenConversation={handleOpenConversation}
                    onStartConversation={handleStartConversation}
                  />
                )}

                {viewMode === 'new' && (
                  <UserSearch
                    conversations={conversations}
                    onOpenConversation={handleOpenConversation}
                    onStartConversation={handleStartConversation}
                  />
                )}
              </CardBody>
            </Card>

            {/* Messages Area */}
            <Card className="lg:col-span-2 flex flex-col overflow-hidden">
              {selectedConversation && user ? (
                <MessageThread
                  conversation={selectedConversation}
                  userId={user.id}
                />
              ) : (
                <CardBody className="flex items-center justify-center h-full">
                  <div className="text-center text-text-secondary">
                    <p className="text-lg mb-2">Select a conversation</p>
                    <p className="text-sm">Choose a conversation from the list to start messaging</p>
                  </div>
                </CardBody>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
