'use client'

import { useRef, useEffect, useState } from 'react'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/Loading'
import { Avatar } from '@/components/ui/Avatar'
import { useMessages } from '@/lib/hooks/queries/useMessages'
import { useSendMessage } from '@/lib/hooks/mutations/useSendMessage'
import Link from 'next/link'
import type { Conversation } from '@/lib/hooks/queries/useMessages'

interface MessageThreadProps {
  conversation: Conversation
  userId: string
}

export function MessageThread({ conversation, userId }: MessageThreadProps) {
  const [messageContent, setMessageContent] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: messages, isLoading } = useMessages(conversation.id)
  const sendMessage = useSendMessage()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!messageContent.trim()) return
    sendMessage.mutate(
      { conversationId: conversation.id, content: messageContent.trim() },
      { onSuccess: () => setMessageContent('') }
    )
  }

  return (
    <>
      {/* Chat Header */}
      <div className="border-b border-bg-tertiary p-4">
        <div className="flex items-center gap-3">
          <Avatar
            src={conversation.otherUser.avatarUrl}
            username={conversation.otherUser.username}
            size="md"
          />
          <div>
            <p className="font-semibold text-white">
              {conversation.otherUser.username}
            </p>
            <Link
              href={`/${conversation.otherUser.username}`}
              className="text-sm text-electric-blue hover:underline"
            >
              View Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Messages */}
      <CardBody className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="text-center text-text-secondary py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.senderId === userId
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                  {!isOwn && (
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar
                        src={message.sender.avatarUrl}
                        username={message.sender.username}
                        size="xs"
                      />
                      <span className="text-xs text-text-secondary">
                        {message.sender.username}
                      </span>
                    </div>
                  )}
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      isOwn
                        ? 'bg-electric-blue text-black'
                        : 'bg-bg-tertiary text-white'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      isOwn ? 'text-black/70' : 'text-text-secondary'
                    }`}>
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </CardBody>

      {/* Message Input */}
      <div className="border-t border-bg-tertiary p-4">
        <div className="flex gap-2">
          <Input
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            isLoading={sendMessage.isPending}
            disabled={!messageContent.trim()}
          >
            Send
          </Button>
        </div>
      </div>
    </>
  )
}
