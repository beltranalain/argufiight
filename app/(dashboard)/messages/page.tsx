'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { LoadingSpinner } from '@/components/ui/Loading'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/lib/hooks/useAuth'
import Link from 'next/link'

interface Conversation {
  id: string
  user1: { id: string; username: string; avatarUrl: string | null }
  user2: { id: string; username: string; avatarUrl: string | null }
  lastMessageAt: string | null
  unreadCount: number
  otherUser: { id: string; username: string; avatarUrl: string | null }
  messages: Array<{
    id: string
    content: string
    createdAt: string
  }>
}

interface Message {
  id: string
  content: string
  senderId: string
  receiverId: string
  isRead: boolean
  createdAt: string
  sender: { id: string; username: string; avatarUrl: string | null }
  receiver: { id: string; username: string; avatarUrl: string | null }
}

export default function MessagesPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageContent, setMessageContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
      // Poll for new messages every 3 seconds
      const interval = setInterval(() => {
        fetchMessages(selectedConversation.id, true)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [selectedConversation])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchConversations = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/messages/conversations')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to load conversations',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string, silent = false) => {
    if (!silent) setIsLoadingMessages(true)
    try {
      const response = await fetch(`/api/messages/conversations/${conversationId}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
        if (!silent) {
          // Update unread count in conversations list
          setConversations(prev => prev.map(conv => 
            conv.id === conversationId 
              ? { ...conv, unreadCount: 0 }
              : conv
          ))
        }
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      if (!silent) {
        showToast({
          type: 'error',
          title: 'Error',
          description: 'Failed to load messages',
        })
      }
    } finally {
      if (!silent) setIsLoadingMessages(false)
    }
  }

  const handleSendMessage = async () => {
    if (!selectedConversation || !messageContent.trim()) return

    setIsSending(true)
    try {
      const response = await fetch(`/api/messages/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: messageContent.trim(),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages([...messages, data.message])
        setMessageContent('')
        fetchConversations() // Refresh conversations to update last message
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send message')
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to send message',
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleStartConversation = async (otherUserId: string) => {
    try {
      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otherUserId }),
      })

      if (response.ok) {
        const data = await response.json()
        setSelectedConversation({
          ...data.conversation,
          otherUser: data.conversation.user1Id === user?.id 
            ? data.conversation.user2 
            : data.conversation.user1,
          unreadCount: 0,
          messages: [],
        })
        fetchConversations()
      }
    } catch (error) {
      console.error('Failed to start conversation:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 pb-20 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 pb-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Direct Messages</h1>
          <p className="text-text-secondary">Chat with other users</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-12rem)]">
          {/* Conversations List */}
          <Card className="lg:col-span-1 overflow-hidden flex flex-col">
            <CardBody className="flex-1 overflow-y-auto p-0">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-text-secondary">
                  <p>No conversations yet</p>
                  <p className="text-sm mt-2">Start a conversation from a user's profile</p>
                </div>
              ) : (
                <div className="divide-y divide-bg-tertiary">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full p-4 text-left hover:bg-bg-secondary transition-colors ${
                        selectedConversation?.id === conv.id ? 'bg-bg-secondary' : ''
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
              )}
            </CardBody>
          </Card>

          {/* Messages Area */}
          <Card className="lg:col-span-2 flex flex-col overflow-hidden">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="border-b border-bg-tertiary p-4">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={selectedConversation.otherUser.avatarUrl}
                      username={selectedConversation.otherUser.username}
                      size="md"
                    />
                    <div>
                      <p className="font-semibold text-white">
                        {selectedConversation.otherUser.username}
                      </p>
                      <Link
                        href={`/profile/${selectedConversation.otherUser.id}`}
                        className="text-sm text-electric-blue hover:underline"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <CardBody className="flex-1 overflow-y-auto p-4 space-y-4">
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center py-8">
                      <LoadingSpinner />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-text-secondary py-8">
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isOwn = message.senderId === user?.id
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
                          handleSendMessage()
                        }
                      }}
                      placeholder="Type a message..."
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      isLoading={isSending}
                      disabled={!messageContent.trim()}
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </>
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
  )
}

