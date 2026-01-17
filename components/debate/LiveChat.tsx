'use client'

import { useState, useEffect, useRef } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/components/ui/Toast'
import { TypingIndicator } from './TypingIndicator'

interface ChatMessage {
  id: string
  content: string
  author: {
    id: string
    username: string
    avatarUrl: string | null
  }
  createdAt: string
}

interface TypingUser {
  id: string
  username: string
  avatarUrl: string | null
}

interface LiveChatProps {
  debateId: string
}

export function LiveChat({ debateId }: LiveChatProps) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollIntervalRef = useRef<number | null>(null)
  const typingPollIntervalRef = useRef<number | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchMessages()
    fetchTypingStatus()
    
    // Poll for new messages every 3 seconds
    pollIntervalRef.current = setInterval(fetchMessages, 3000) as any as number
    
    // Poll for typing status every 1 second
    typingPollIntervalRef.current = setInterval(fetchTypingStatus, 1000) as any as number

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
      if (typingPollIntervalRef.current) {
        clearInterval(typingPollIntervalRef.current)
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [debateId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/debates/${debateId}/chat`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      } else if (response.status === 403) {
        // User is not a participant - silently stop polling
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
        setMessages([])
      } else if (response.status === 401) {
        // Not authenticated - silently stop polling
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
        setMessages([])
      }
    } catch (error) {
      // Silently handle network errors
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTypingStatus = async () => {
    try {
      const response = await fetch(`/api/debates/${debateId}/chat/typing`)
      if (response.ok) {
        const data = await response.json()
        setTypingUsers(data.typingUsers || [])
      }
    } catch (error) {
      // Silently handle errors
    }
  }

  const setTypingStatus = async () => {
    try {
      await fetch(`/api/debates/${debateId}/chat/typing`, {
        method: 'POST',
      })
    } catch (error) {
      // Silently handle errors
    }
  }

  const handleTyping = (value: string) => {
    setMessage(value)
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Set typing status immediately
    if (value.trim().length > 0) {
      setTypingStatus()
    }
    
    // Clear typing status after 2 seconds of no typing
    typingTimeoutRef.current = setTimeout(() => {
      // Typing status will auto-expire after 3 seconds on server
    }, 2000)
  }

  const scrollToBottom = () => {
    // Only scroll within the chat container, not the whole page
    if (messagesEndRef.current) {
      const chatContainer = messagesEndRef.current.closest('.overflow-y-auto')
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight
      } else {
        // Fallback: use scrollIntoView but only if element is visible
        const rect = messagesEndRef.current.getBoundingClientRect()
        const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight
        if (isVisible) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
      }
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const messageToSend = message.trim()
    if (!messageToSend || isSending) return

    // Clear the input immediately for better UX
    setMessage('')
    setIsSending(true)
    
    try {
      const response = await fetch(`/api/debates/${debateId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageToSend }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send message')
      }

      const newMessage = await response.json()
      
      // Only update messages if the response is successful
      setMessages(prev => [...prev, newMessage])
      
      // Clear typing timeout when message is sent
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      scrollToBottom()
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Send Failed',
        description: error.message || 'Failed to send message',
      })
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="sm" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[500px] bg-bg-secondary border border-bg-tertiary rounded-lg">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-text-secondary text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = user?.id === msg.author.id
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <Avatar
                  src={msg.author.avatarUrl}
                  username={msg.author.username}
                  size="sm"
                />
                <div className={`flex-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block p-3 rounded-lg max-w-[80%] ${
                    isOwnMessage
                      ? 'bg-electric-blue text-black'
                      : 'bg-bg-tertiary text-text-primary'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                  <p className="text-xs text-text-muted mt-1">
                    {msg.author.username} • {new Date(msg.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            )
          })
        )}
        {typingUsers.length > 0 && (
          <TypingIndicator users={typingUsers} />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t border-bg-tertiary p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => handleTyping(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-bg-tertiary border border-bg-tertiary rounded-lg px-4 py-2 text-text-primary placeholder-text-muted focus:outline-none focus:border-electric-blue"
            maxLength={1000}
            disabled={isSending}
          />
          <Button
            type="submit"
            variant="primary"
            disabled={!message.trim() || isSending}
            isLoading={isSending}
          >
            Send
          </Button>
        </div>
        <p className="text-xs text-text-muted mt-2">
          {message.length}/1000 characters
        </p>
      </form>
    </div>
  )
}

