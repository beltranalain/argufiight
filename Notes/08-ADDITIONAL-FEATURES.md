# PART 9: ADDITIONAL FEATURES

Notifications, live chat, ELO leaderboard, and profile pages.

---

## OVERVIEW

This part covers:
- Notification system
- Live chat in debates
- ELO leaderboard
- User profile pages
- Challenge panels
- Profile panel

---

## NOTIFICATIONS SYSTEM

### File: app/api/notifications/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const where: any = { userId: session.user.id }
    if (unreadOnly) {
      where.read = false
    }

    const notifications = await prisma.notification.findMany({
      where,
      include: {
        debate: {
          select: {
            id: true,
            topic: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}
```

---

### File: app/api/notifications/[id]/read/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'

// POST /api/notifications/[id]/read - Mark as read
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.notification.update({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to mark notification as read:', error)
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    )
  }
}
```

---

## LIVE CHAT SYSTEM

### File: app/api/debates/[id]/chat/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/debates/[id]/chat - Get chat messages
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: {
        debateId: params.id,
        deleted: false,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 100,
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Failed to fetch messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST /api/debates/[id]/chat - Send message
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content } = await request.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      )
    }

    if (content.length > 200) {
      return NextResponse.json(
        { error: 'Message too long (max 200 characters)' },
        { status: 400 }
      )
    }

    const message = await prisma.chatMessage.create({
      data: {
        debateId: params.id,
        authorId: session.user.id,
        content: content.trim(),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error('Failed to send message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
```

---

## LEADERBOARD

### File: app/api/leaderboard/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const leaderboard = await prisma.profile.findMany({
      where: {
        totalDebates: { gt: 0 },
      },
      orderBy: {
        eloRating: 'desc',
      },
      take: limit,
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        eloRating: true,
        debatesWon: true,
        debatesLost: true,
        debatesTied: true,
        totalDebates: true,
      },
    })

    return NextResponse.json(leaderboard)
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}
```

---

## CURSOR.AI PROMPTS

### PROMPT 1: Notification Dropdown

```
Create a notification dropdown component:

File: components/layout/NotificationDropdown.tsx

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/Badge'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
  debate?: {
    id: string
    topic: string
  }
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      const data = await response.json()
      setNotifications(data)
      setUnreadCount(data.filter((n: Notification) => !n.read).length)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'DEBATE_TURN': return '⏰'
      case 'DEBATE_ACCEPTED': return '✅'
      case 'VERDICT_READY': return '⚖️'
      case 'DEBATE_WON': return '🏆'
      case 'DEBATE_LOST': return '😔'
      case 'DEBATE_TIED': return '🤝'
      default: return '🔔'
    }
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-neon-orange rounded-full flex items-center justify-center text-xs font-bold text-black">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 top-full mt-2 w-96 bg-bg-secondary border border-bg-tertiary rounded-xl shadow-2xl z-50 max-h-[500px] overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-bg-tertiary">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <Badge variant="warning" size="sm">
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
              </div>

              {/* Notifications List */}
              <div className="overflow-y-auto max-h-[400px]">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-text-secondary">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <Link
                      key={notification.id}
                      href={notification.debate ? `/debate/${notification.debate.id}` : '#'}
                      onClick={() => {
                        markAsRead(notification.id)
                        setIsOpen(false)
                      }}
                      className={`block p-4 border-b border-bg-tertiary hover:bg-bg-tertiary transition-colors ${
                        !notification.read ? 'bg-electric-blue/5' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="text-2xl flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-white text-sm">
                            {notification.title}
                          </p>
                          <p className="text-xs text-text-secondary mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-text-muted mt-2">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-electric-blue rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
```

---

### PROMPT 2: Live Chat Component

```
Create live chat sidebar for debates:

File: components/debate/LiveChat.tsx

'use client'

import { useState, useEffect, useRef } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'

interface Message {
  id: string
  content: string
  createdAt: string
  author: {
    id: string
    username: string
    avatarUrl: string | null
  }
}

interface LiveChatProps {
  debateId: string
}

export function LiveChat({ debateId }: LiveChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMessages()
    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [debateId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/debates/${debateId}/chat`)
      const data = await response.json()
      setMessages(data)
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return

    setIsSending(true)

    try {
      const response = await fetch(`/api/debates/${debateId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage }),
      })

      if (response.ok) {
        setNewMessage('')
        fetchMessages()
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="h-full flex flex-col bg-bg-secondary border border-bg-tertiary rounded-xl">
      {/* Header */}
      <div className="p-4 border-b border-bg-tertiary">
        <h3 className="font-bold text-white flex items-center gap-2">
          💬 Live Chat
          <span className="text-xs text-text-muted">
            {messages.length} messages
          </span>
        </h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-text-secondary py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex gap-3">
              <Avatar
                src={message.author.avatarUrl}
                username={message.author.username}
                size="sm"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-white">
                    {message.author.username}
                  </span>
                  <span className="text-xs text-text-muted">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-text-primary">{message.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-bg-tertiary">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            maxLength={200}
            className="flex-1 bg-bg-primary border border-bg-tertiary rounded-lg px-3 py-2 text-sm text-white focus:border-electric-blue focus:outline-none"
          />
          <Button
            variant="primary"
            onClick={sendMessage}
            isLoading={isSending}
            disabled={!newMessage.trim()}
          >
            Send
          </Button>
        </div>
        <p className="text-xs text-text-muted mt-2">
          {newMessage.length}/200
        </p>
      </div>
    </div>
  )
}
```

---

### PROMPT 3: Leaderboard Panel

```
Create ELO leaderboard component:

File: components/panels/LeaderboardPanel.tsx

'use client'

import { useState, useEffect } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { LoadingCard } from '@/components/ui/Loading'

interface LeaderboardEntry {
  id: string
  username: string
  avatarUrl: string | null
  eloRating: number
  debatesWon: number
  debatesLost: number
  debatesTied: number
  totalDebates: number
}

export function LeaderboardPanel() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/leaderboard')
      const data = await response.json()
      setLeaderboard(data)
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return '🥇'
      case 1: return '🥈'
      case 2: return '🥉'
      default: return `#${index + 1}`
    }
  }

  const getWinRate = (entry: LeaderboardEntry) => {
    if (entry.totalDebates === 0) return 0
    return Math.round((entry.debatesWon / entry.totalDebates) * 100)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <LoadingCard key={i} lines={2} />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-white mb-2">ELO Leaderboard</h2>
        <p className="text-text-secondary">Top debaters ranked by ELO rating</p>
      </div>

      <div className="space-y-3">
        {leaderboard.map((entry, index) => (
          <div
            key={entry.id}
            className="bg-bg-secondary border border-bg-tertiary rounded-xl p-4 hover:border-electric-blue transition-all"
          >
            <div className="flex items-center gap-4">
              {/* Rank */}
              <div className="w-12 text-center">
                {index < 3 ? (
                  <span className="text-3xl">{getRankIcon(index)}</span>
                ) : (
                  <span className="text-xl font-bold text-text-muted">
                    #{index + 1}
                  </span>
                )}
              </div>

              {/* Avatar */}
              <Avatar
                src={entry.avatarUrl}
                username={entry.username}
                size="lg"
              />

              {/* Info */}
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">
                  {entry.username}
                </h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-text-secondary">
                    {entry.totalDebates} debates
                  </span>
                  <span className="text-sm text-cyber-green font-semibold">
                    {getWinRate(entry)}% win rate
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="text-right">
                <div className="text-3xl font-bold text-electric-blue mb-1">
                  {entry.eloRating}
                </div>
                <div className="text-xs text-text-muted">ELO Rating</div>
              </div>

              {/* Record */}
              <div className="text-right min-w-[100px]">
                <div className="flex gap-1 justify-end mb-1">
                  <Badge variant="success" size="sm">{entry.debatesWon}W</Badge>
                  <Badge variant="error" size="sm">{entry.debatesLost}L</Badge>
                  {entry.debatesTied > 0 && (
                    <Badge variant="default" size="sm">{entry.debatesTied}T</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

### PROMPT 4: Challenges Panel

```
Create open challenges panel:

File: components/panels/ChallengesPanel.tsx

'use client'

import { useState, useEffect } from 'react'
import { DebateCard } from '@/components/debate/DebateCard'
import { LoadingCard } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'

export function ChallengesPanel() {
  const [challenges, setChallenges] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    fetchChallenges()
  }, [filter])

  const fetchChallenges = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(
        `/api/debates?status=WAITING&category=${filter}`
      )
      const data = await response.json()
      setChallenges(data)
    } catch (error) {
      console.error('Failed to fetch challenges:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-3xl font-bold text-white mb-2">Open Challenges</h3>
          <p className="text-text-secondary">
            Accept a challenge and start debating
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {['ALL', 'SPORTS', 'TECH', 'POLITICS', 'ENTERTAINMENT'].map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-4 py-2 rounded-lg border-2 font-semibold transition-all ${
                filter === category
                  ? 'border-electric-blue bg-electric-blue/10 text-electric-blue'
                  : 'border-bg-tertiary text-text-secondary hover:border-text-secondary'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <LoadingCard key={i} lines={4} />
          ))}
        </div>
      ) : challenges.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="No Open Challenges"
          description={`No ${filter === 'ALL' ? '' : filter} challenges available right now`}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {challenges.map((challenge: any) => (
            <DebateCard key={challenge.id} debate={challenge} />
          ))}
        </div>
      )}
    </>
  )
}
```

---

### PROMPT 5: Profile Panel

```
Create user profile panel:

File: components/panels/ProfilePanel.tsx

'use client'

import { useState, useEffect } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { DebateCard } from '@/components/debate/DebateCard'
import { useAuth } from '@/lib/hooks/useAuth'

export function ProfilePanel() {
  const { profile } = useAuth()
  const [recentDebates, setRecentDebates] = useState([])
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    if (profile?.id) {
      fetchUserData()
    }
  }, [profile?.id])

  const fetchUserData = async () => {
    try {
      // Fetch recent debates
      const debatesResponse = await fetch(
        `/api/debates?userId=${profile?.id}`
      )
      const debatesData = await debatesResponse.json()
      setRecentDebates(debatesData.slice(0, 5))

      // Calculate stats
      setStats({
        totalDebates: profile?.totalDebates || 0,
        wins: profile?.debatesWon || 0,
        losses: profile?.debatesLost || 0,
        ties: profile?.debatesTied || 0,
        elo: profile?.eloRating || 1200,
        winRate: profile?.totalDebates
          ? Math.round((profile.debatesWon / profile.totalDebates) * 100)
          : 0,
      })
    } catch (error) {
      console.error('Failed to fetch user data:', error)
    }
  }

  if (!profile || !stats) return <div>Loading...</div>

  return (
    <div>
      {/* Profile Header */}
      <div className="mb-8">
        <div className="flex items-center gap-6 mb-6">
          <Avatar
            src={profile.avatarUrl}
            username={profile.username}
            size="xl"
          />
          <div>
            <h2 className="text-4xl font-bold text-white mb-2">
              {profile.username}
            </h2>
            {profile.bio && (
              <p className="text-text-secondary">{profile.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardBody className="text-center">
            <div className="text-4xl font-bold text-electric-blue mb-2">
              {stats.elo}
            </div>
            <div className="text-sm text-text-secondary">ELO Rating</div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center">
            <div className="text-4xl font-bold text-white mb-2">
              {stats.totalDebates}
            </div>
            <div className="text-sm text-text-secondary">Total Debates</div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center">
            <div className="text-4xl font-bold text-cyber-green mb-2">
              {stats.winRate}%
            </div>
            <div className="text-sm text-text-secondary">Win Rate</div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center">
            <div className="flex gap-1 justify-center mb-2">
              <Badge variant="success">{stats.wins}W</Badge>
              <Badge variant="error">{stats.losses}L</Badge>
              <Badge variant="default">{stats.ties}T</Badge>
            </div>
            <div className="text-sm text-text-secondary">Record</div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Debates */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-4">Recent Debates</h3>
        {recentDebates.length === 0 ? (
          <Card>
            <CardBody className="text-center py-8 text-text-secondary">
              No debates yet. Start your first debate!
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {recentDebates.map((debate: any) => (
              <DebateCard key={debate.id} debate={debate} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## IMPLEMENTATION ORDER

1. Create notification API routes
2. Create chat API routes
3. Create leaderboard API route
4. Run Prompt 1 (Notification Dropdown) - add to TopNav
5. Run Prompt 2 (Live Chat) - add to debate page
6. Run Prompt 3 (Leaderboard Panel)
7. Run Prompt 4 (Challenges Panel)
8. Run Prompt 5 (Profile Panel)
9. Update homepage to use new panels

---

## FINAL TOUCHES

Update the homepage panels:

File: app/(dashboard)/page.tsx
```typescript
import { ChallengesPanel } from '@/components/panels/ChallengesPanel'
import { ProfilePanel } from '@/components/panels/ProfilePanel'

// Replace placeholder panels with actual components
```

Add NotificationDropdown to TopNav:
```typescript
import { NotificationDropdown } from '@/components/layout/NotificationDropdown'

// Replace notification button with <NotificationDropdown />
```

Add LiveChat to debate page:
```typescript
import { LiveChat } from '@/components/debate/LiveChat'

// Add as sidebar: <LiveChat debateId={debate.id} />
```

PART 9 COMPLETE!
