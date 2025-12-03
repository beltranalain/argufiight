# PART 5: HORIZONTAL HOMEPAGE

The unique horizontal-scrolling interface with panel-based navigation.

---

## OVERVIEW

This part covers:
- 4-panel horizontal layout
- Snap-scrolling navigation
- Top navigation bar
- Panel 1: Arena (debate feed)
- Panel 2: Live Battle (active debate view)
- Panel 3: Open Challenges
- Panel 4: Profile/Stats
- HTML reference template
- Complete implementation

---

## PANEL STRUCTURE

```
Panel 1: THE ARENA
- Trending topics
- Live debates feed
- Filter by category
- Create debate FAB

Panel 2: LIVE BATTLE
- Current debate view
- Round-by-round arguments
- Submit your argument
- Live chat sidebar

Panel 3: OPEN CHALLENGES
- Debates waiting for opponents
- Accept challenge button
- Filter by category
- Empty state if none

Panel 4: YOUR PROFILE
- ELO rating
- Win/loss stats
- Recent debates
- Achievements
```

---

## FILE STRUCTURE

```
app/
├── (dashboard)/
│   ├── layout.tsx          # Dashboard wrapper
│   ├── page.tsx            # Horizontal homepage
│   └── debate/
│       └── [id]/
│           └── page.tsx    # Individual debate page

components/
├── layout/
│   ├── TopNav.tsx          # Fixed top navigation
│   ├── HorizontalContainer.tsx
│   ├── NavigationDots.tsx
│   └── Sidebar.tsx
├── panels/
│   ├── ArenaPanel.tsx
│   ├── LiveBattlePanel.tsx
│   ├── ChallengesPanel.tsx
│   └── ProfilePanel.tsx
├── debate/
│   ├── DebateCard.tsx
│   ├── CreateDebateModal.tsx
│   ├── TrendingTopics.tsx
│   └── DebateFeed.tsx
└── ui/
    └── (already created)
```

---

## HTML REFERENCE TEMPLATE

First, let me create the pixel-perfect HTML template:

---

## CURSOR.AI IMPLEMENTATION PROMPTS

### PROMPT 1: Layout Components

```
Create the horizontal layout system matching html-templates/homepage-horizontal.html:

File: components/layout/HorizontalContainer.tsx

'use client'

import { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface HorizontalContainerProps {
  children: React.ReactNode
  activePanel: number
  onPanelChange: (index: number) => void
}

export function HorizontalContainer({ 
  children, 
  activePanel,
  onPanelChange 
}: HorizontalContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Scroll to active panel
  useEffect(() => {
    if (!containerRef.current) return
    
    const panelWidth = containerRef.current.clientWidth
    containerRef.current.scrollTo({
      left: activePanel * panelWidth,
      behavior: 'smooth'
    })
  }, [activePanel])

  // Update active panel on scroll
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft
      const panelWidth = container.clientWidth
      const newPanel = Math.round(scrollLeft / panelWidth)
      
      if (newPanel !== activePanel) {
        onPanelChange(newPanel)
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [activePanel, onPanelChange])

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex h-[calc(100vh-80px)] mt-20',
        'overflow-x-auto overflow-y-hidden',
        'scroll-snap-type-x scroll-snap-type-mandatory',
        'scrollbar-none'
      )}
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      {children}
    </div>
  )
}

---

File: components/layout/Panel.tsx

import { cn } from '@/lib/utils'

interface PanelProps {
  children: React.ReactNode
  className?: string
}

export function Panel({ children, className }: PanelProps) {
  return (
    <div
      className={cn(
        'min-w-screen w-screen h-full',
        'scroll-snap-align-start',
        'overflow-y-auto overflow-x-hidden',
        'p-10',
        className
      )}
    >
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  )
}

---

File: components/layout/NavigationDots.tsx

import { cn } from '@/lib/utils'

interface NavigationDotsProps {
  total: number
  active: number
  onDotClick: (index: number) => void
}

export function NavigationDots({ total, active, onDotClick }: NavigationDotsProps) {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-50">
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          onClick={() => onDotClick(index)}
          className={cn(
            'h-3 rounded-full transition-all duration-300',
            index === active
              ? 'w-8 bg-electric-blue'
              : 'w-3 bg-text-muted hover:bg-text-secondary'
          )}
          aria-label={`Go to panel ${index + 1}`}
        />
      ))}
    </div>
  )
}

---

File: components/layout/TopNav.tsx

'use client'

import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/lib/hooks/useAuth'

interface TopNavProps {
  currentPanel: string
}

export function TopNav({ currentPanel }: TopNavProps) {
  const { user, profile } = useAuth()

  return (
    <nav className="fixed top-0 left-0 right-0 h-20 bg-black/80 backdrop-blur-sm border-b border-bg-tertiary z-50">
      <div className="h-full px-8 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-electric-blue to-neon-orange flex items-center justify-center text-xl">
            ⚖
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-electric-blue to-neon-orange bg-clip-text text-transparent">
            HONORABLE AI
          </span>
        </Link>

        {/* Panel Title */}
        <h2 className="absolute left-1/2 -translate-x-1/2 text-2xl font-bold text-white hidden md:block">
          {currentPanel}
        </h2>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 hover:bg-bg-tertiary rounded-lg transition-colors">
            <span className="text-xl">🔔</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-neon-orange rounded-full animate-pulse-glow" />
          </button>

          {/* Profile */}
          <Link 
            href="/profile" 
            className="flex items-center gap-3 hover:bg-bg-tertiary rounded-lg p-2 transition-colors"
          >
            <Avatar 
              src={profile?.avatarUrl} 
              username={profile?.username}
              size="sm"
            />
            <span className="font-semibold text-white hidden sm:block">
              {profile?.username || 'User'}
            </span>
          </Link>
        </div>
      </div>
    </nav>
  )
}
```

---

### PROMPT 2: Trending Topics Component

```
Create the trending topics horizontal scroll matching the HTML template:

File: components/debate/TrendingTopics.tsx

'use client'

import { Badge } from '@/components/ui/Badge'

interface Topic {
  id: string
  title: string
  category: string
  icon: string
  debateCount: number
}

const MOCK_TOPICS: Topic[] = [
  {
    id: '1',
    title: 'Is AI Art Real Art?',
    category: 'TECH',
    icon: '🎨',
    debateCount: 234,
  },
  {
    id: '2',
    title: 'Mahomes vs Brady: Who\'s Better?',
    category: 'SPORTS',
    icon: '🏈',
    debateCount: 456,
  },
  {
    id: '3',
    title: 'Should UBI Exist?',
    category: 'POLITICS',
    icon: '💰',
    debateCount: 189,
  },
  {
    id: '4',
    title: 'Streaming vs Theaters',
    category: 'ENTERTAINMENT',
    icon: '🎬',
    debateCount: 312,
  },
  {
    id: '5',
    title: 'Is Nuclear Energy Safe?',
    category: 'SCIENCE',
    icon: '⚛️',
    debateCount: 167,
  },
]

interface TrendingTopicsProps {
  onTopicClick?: (topic: Topic) => void
}

export function TrendingTopics({ onTopicClick }: TrendingTopicsProps) {
  return (
    <div className="mb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-3xl font-bold text-white">Trending Topics</h3>
        <button className="text-electric-blue hover:text-neon-orange text-sm font-medium transition-colors">
          View All →
        </button>
      </div>

      {/* Horizontal Scroll */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-electric-blue scrollbar-track-bg-secondary">
        {MOCK_TOPICS.map((topic) => (
          <button
            key={topic.id}
            onClick={() => onTopicClick?.(topic)}
            className="min-w-[320px] bg-bg-secondary border border-bg-tertiary rounded-xl p-6 hover:border-electric-blue hover:shadow-[0_8px_24px_rgba(0,217,255,0.1)] hover:-translate-y-1 transition-all text-left"
          >
            <div className="text-4xl mb-3">{topic.icon}</div>
            
            <Badge 
              variant={topic.category.toLowerCase() as any}
              size="sm"
              className="mb-3"
            >
              {topic.category}
            </Badge>
            
            <h4 className="text-lg font-bold text-white mb-4">
              {topic.title}
            </h4>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">
                {topic.debateCount} debates
              </span>
              <span className="text-electric-blue font-semibold">
                Start Debate →
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
```

---

### PROMPT 3: Debate Card Component

```
Create the debate card component matching the HTML template:

File: components/debate/DebateCard.tsx

import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import type { Debate, Profile } from '@prisma/client'

interface DebateCardProps {
  debate: Debate & {
    challenger: Profile
    opponent: Profile | null
  }
}

export function DebateCard({ debate }: DebateCardProps) {
  const progress = (debate.currentRound / debate.totalRounds) * 100
  const timeLeft = calculateTimeLeft(debate.roundDeadline)

  return (
    <Link
      href={`/debate/${debate.id}`}
      className="block bg-bg-secondary border border-bg-tertiary rounded-2xl p-6 hover:border-electric-blue hover:shadow-[0_8px_32px_rgba(0,217,255,0.15)] hover:-translate-y-1 transition-all"
    >
      {/* Category Badge */}
      <Badge 
        variant={debate.category.toLowerCase() as any}
        size="md"
        className="mb-4"
      >
        {debate.category}
      </Badge>

      {/* Topic */}
      <h4 className="text-xl font-bold text-white mb-5 group-hover:text-electric-blue transition-colors">
        {debate.topic}
      </h4>

      {/* Debaters */}
      <div className="flex items-center justify-between mb-5">
        {/* Challenger */}
        <div className="flex items-center gap-3">
          <Avatar 
            src={debate.challenger.avatarUrl}
            username={debate.challenger.username}
            size="md"
          />
          <div>
            <p className="font-semibold text-white text-sm">
              {debate.challenger.username}
            </p>
            <p className="text-xs text-text-muted uppercase">
              {debate.challengerPosition}
            </p>
          </div>
        </div>

        {/* VS */}
        <span className="text-xl font-bold text-text-muted">VS</span>

        {/* Opponent */}
        {debate.opponent ? (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-semibold text-white text-sm">
                {debate.opponent.username}
              </p>
              <p className="text-xs text-text-muted uppercase">
                {debate.opponentPosition}
              </p>
            </div>
            <Avatar 
              src={debate.opponent.avatarUrl}
              username={debate.opponent.username}
              size="md"
            />
          </div>
        ) : (
          <div className="text-text-muted text-sm">Waiting...</div>
        )}
      </div>

      {/* Progress */}
      <div className="mb-5">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-text-secondary">
            Round {debate.currentRound}/{debate.totalRounds}
          </span>
          <span className="text-electric-blue font-medium">
            {timeLeft}
          </span>
        </div>
        <div className="w-full h-1 bg-bg-tertiary rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-electric-blue to-neon-orange transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4 text-text-secondary">
          <span>👁 {debate.spectatorCount} watching</span>
          {debate.status === 'ACTIVE' && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-cyber-green rounded-full animate-pulse-glow" />
              <span className="text-cyber-green font-semibold">LIVE</span>
            </div>
          )}
        </div>
        <span className="text-electric-blue font-semibold">
          Watch →
        </span>
      </div>
    </Link>
  )
}

function calculateTimeLeft(deadline: Date | null): string {
  if (!deadline) return '—'
  
  const now = new Date()
  const diff = deadline.getTime() - now.getTime()
  
  if (diff <= 0) return 'Ended'
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  return `${hours}h ${minutes}m left`
}
```

---

### PROMPT 4: Homepage Implementation

```
Create the main homepage with horizontal panels matching html-templates/homepage-horizontal.html:

File: app/(dashboard)/page.tsx

'use client'

import { useState } from 'react'
import { TopNav } from '@/components/layout/TopNav'
import { HorizontalContainer } from '@/components/layout/HorizontalContainer'
import { Panel } from '@/components/layout/Panel'
import { NavigationDots } from '@/components/layout/NavigationDots'
import { ArenaPanel } from '@/components/panels/ArenaPanel'
import { LiveBattlePanel } from '@/components/panels/LiveBattlePanel'
import { ChallengesPanel } from '@/components/panels/ChallengesPanel'
import { ProfilePanel } from '@/components/panels/ProfilePanel'

const PANEL_TITLES = ['THE ARENA', 'LIVE BATTLE', 'OPEN CHALLENGES', 'YOUR PROFILE']

export default function HomePage() {
  const [activePanel, setActivePanel] = useState(0)

  return (
    <div className="h-screen bg-black overflow-hidden">
      <TopNav currentPanel={PANEL_TITLES[activePanel]} />
      
      <HorizontalContainer
        activePanel={activePanel}
        onPanelChange={setActivePanel}
      >
        <Panel>
          <ArenaPanel />
        </Panel>
        
        <Panel className="bg-bg-secondary">
          <LiveBattlePanel />
        </Panel>
        
        <Panel>
          <ChallengesPanel />
        </Panel>
        
        <Panel className="bg-bg-secondary">
          <ProfilePanel />
        </Panel>
      </HorizontalContainer>

      <NavigationDots
        total={4}
        active={activePanel}
        onDotClick={setActivePanel}
      />

      {/* FAB Button */}
      <button className="fixed bottom-24 right-8 w-16 h-16 rounded-full bg-gradient-to-r from-electric-blue to-neon-orange flex items-center justify-center text-3xl text-black shadow-lg hover:scale-110 transition-transform z-40">
        ➕
      </button>
    </div>
  )
}

---

File: components/panels/ArenaPanel.tsx

'use client'

import { useState, useEffect } from 'react'
import { TrendingTopics } from '@/components/debate/TrendingTopics'
import { DebateCard } from '@/components/debate/DebateCard'
import { LoadingCard } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'

export function ArenaPanel() {
  const [debates, setDebates] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    // Fetch debates from API
    fetchDebates()
  }, [filter])

  const fetchDebates = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/debates?status=ACTIVE&category=${filter}`)
      const data = await response.json()
      setDebates(data)
    } catch (error) {
      console.error('Failed to fetch debates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Trending Topics */}
      <TrendingTopics />

      {/* Live Debates */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-3xl font-bold text-white mb-2">Live Battles</h3>
          <p className="text-text-secondary">Watch debates unfold in real-time</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {['ALL', 'SPORTS', 'TECH', 'POLITICS'].map((category) => (
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

      {/* Debate Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <LoadingCard key={i} lines={4} />
          ))}
        </div>
      ) : debates.length === 0 ? (
        <EmptyState
          icon="⚖️"
          title="No Active Debates"
          description="Be the first to start a debate!"
          action={{
            label: 'Create Debate',
            onClick: () => {/* Open create modal */},
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {debates.map((debate: any) => (
            <DebateCard key={debate.id} debate={debate} />
          ))}
        </div>
      )}
    </>
  )
}
```

---

## IMPLEMENTATION ORDER

1. Run Prompt 1 (Layout Components)
2. Run Prompt 2 (Trending Topics)
3. Run Prompt 3 (Debate Card)
4. Run Prompt 4 (Homepage)
5. Create placeholder panels (LiveBattle, Challenges, Profile)
6. Test horizontal scrolling
7. Verify it matches html-templates/homepage-horizontal.html

---

## TESTING

After implementation:
1. Go to http://localhost:3000
2. Verify horizontal scrolling works
3. Check navigation dots update on scroll
4. Click dots to jump to panels
5. Verify panel title updates in top nav
6. Test FAB button visibility
7. Compare with HTML template for pixel-perfect match

PART 5 COMPLETE!
