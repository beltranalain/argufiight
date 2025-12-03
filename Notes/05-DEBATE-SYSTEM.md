# PART 6: DEBATE SYSTEM

Complete debate creation, management, and argument submission system.

---

## OVERVIEW

This part covers:
- Create debate modal
- Debate flow management
- Round-by-round submissions
- Debate status transitions
- API routes for debates
- Database operations

---

## DEBATE FLOW

```
1. CREATE DEBATE
   - User selects topic
   - Chooses position (FOR/AGAINST)
   - Sets configuration (rounds, speed mode)
   - Creates debate (status: WAITING)

2. OPPONENT ACCEPTS
   - Debate status → ACTIVE
   - Round 1 starts
   - Deadline set (24 hours or 1 hour for speed mode)

3. ROUND PROGRESSION
   - Challenger submits argument
   - Opponent submits rebuttal
   - Round advances
   - Repeat for 5 rounds (or 3 for speed mode)

4. COMPLETION
   - All rounds complete
   - Status → COMPLETED
   - AI judges triggered
   - Verdicts generated
   - Status → VERDICT_READY
   - ELO updated
```

---

## API ROUTES

### File: app/api/debates/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/debates - List debates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const userId = searchParams.get('userId')

    const where: any = {}

    if (status && status !== 'ALL') {
      where.status = status
    }

    if (category && category !== 'ALL') {
      where.category = category
    }

    if (userId) {
      where.OR = [
        { challengerId: userId },
        { opponentId: userId }
      ]
    }

    const debates = await prisma.debate.findMany({
      where,
      include: {
        challenger: true,
        opponent: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    })

    return NextResponse.json(debates)
  } catch (error) {
    console.error('Failed to fetch debates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch debates' },
      { status: 500 }
    )
  }
}

// POST /api/debates - Create debate
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      topic, 
      description, 
      category, 
      position,
      speedMode = false
    } = body

    // Validation
    if (!topic || !category || !position) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create debate
    const debate = await prisma.debate.create({
      data: {
        topic,
        description,
        category,
        challengerId: session.user.id,
        challengerPosition: position,
        opponentPosition: position === 'FOR' ? 'AGAINST' : 'FOR',
        speedMode,
        totalRounds: speedMode ? 3 : 5,
        roundDuration: speedMode ? 3600000 : 86400000, // 1h or 24h
        status: 'WAITING',
      },
      include: {
        challenger: true,
      },
    })

    return NextResponse.json(debate)
  } catch (error) {
    console.error('Failed to create debate:', error)
    return NextResponse.json(
      { error: 'Failed to create debate' },
      { status: 500 }
    )
  }
}
```

---

### File: app/api/debates/[id]/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/debates/[id] - Get single debate
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const debate = await prisma.debate.findUnique({
      where: { id: params.id },
      include: {
        challenger: true,
        opponent: true,
        statements: {
          include: {
            author: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        verdicts: {
          include: {
            judge: true,
          },
        },
      },
    })

    if (!debate) {
      return NextResponse.json(
        { error: 'Debate not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(debate)
  } catch (error) {
    console.error('Failed to fetch debate:', error)
    return NextResponse.json(
      { error: 'Failed to fetch debate' },
      { status: 500 }
    )
  }
}
```

---

### File: app/api/debates/[id]/accept/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'

// POST /api/debates/[id]/accept - Accept challenge
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

    // Get debate
    const debate = await prisma.debate.findUnique({
      where: { id: params.id },
    })

    if (!debate) {
      return NextResponse.json(
        { error: 'Debate not found' },
        { status: 404 }
      )
    }

    if (debate.status !== 'WAITING') {
      return NextResponse.json(
        { error: 'Debate is not accepting opponents' },
        { status: 400 }
      )
    }

    if (debate.challengerId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot accept your own debate' },
        { status: 400 }
      )
    }

    // Calculate round deadline
    const now = new Date()
    const deadline = new Date(now.getTime() + debate.roundDuration)

    // Update debate
    const updatedDebate = await prisma.debate.update({
      where: { id: params.id },
      data: {
        opponentId: session.user.id,
        status: 'ACTIVE',
        startedAt: now,
        roundDeadline: deadline,
      },
      include: {
        challenger: true,
        opponent: true,
      },
    })

    // Create notification for challenger
    await prisma.notification.create({
      data: {
        userId: debate.challengerId,
        type: 'DEBATE_ACCEPTED',
        title: 'Challenge Accepted!',
        message: `Your debate "${debate.topic}" has been accepted`,
        debateId: debate.id,
      },
    })

    return NextResponse.json(updatedDebate)
  } catch (error) {
    console.error('Failed to accept debate:', error)
    return NextResponse.json(
      { error: 'Failed to accept debate' },
      { status: 500 }
    )
  }
}
```

---

### File: app/api/debates/[id]/submit/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'

// POST /api/debates/[id]/submit - Submit argument
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

    if (!content || content.trim().length < 100) {
      return NextResponse.json(
        { error: 'Argument must be at least 100 characters' },
        { status: 400 }
      )
    }

    if (content.length > 500) {
      return NextResponse.json(
        { error: 'Argument must be less than 500 characters' },
        { status: 400 }
      )
    }

    // Get debate
    const debate = await prisma.debate.findUnique({
      where: { id: params.id },
    })

    if (!debate) {
      return NextResponse.json(
        { error: 'Debate not found' },
        { status: 404 }
      )
    }

    if (debate.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Debate is not active' },
        { status: 400 }
      )
    }

    // Check if user is a participant
    if (
      session.user.id !== debate.challengerId &&
      session.user.id !== debate.opponentId
    ) {
      return NextResponse.json(
        { error: 'Not a participant in this debate' },
        { status: 403 }
      )
    }

    // Check if user already submitted for this round
    const existingStatement = await prisma.statement.findUnique({
      where: {
        debateId_authorId_round: {
          debateId: params.id,
          authorId: session.user.id,
          round: debate.currentRound,
        },
      },
    })

    if (existingStatement) {
      return NextResponse.json(
        { error: 'Already submitted for this round' },
        { status: 400 }
      )
    }

    // Create statement
    const statement = await prisma.statement.create({
      data: {
        debateId: params.id,
        authorId: session.user.id,
        round: debate.currentRound,
        content,
      },
    })

    // Check if both participants have submitted
    const roundStatements = await prisma.statement.count({
      where: {
        debateId: params.id,
        round: debate.currentRound,
      },
    })

    let updatedDebate = debate

    if (roundStatements === 2) {
      // Both submitted, advance round
      if (debate.currentRound >= debate.totalRounds) {
        // Debate complete
        updatedDebate = await prisma.debate.update({
          where: { id: params.id },
          data: {
            status: 'COMPLETED',
            endedAt: new Date(),
          },
        })

        // Trigger AI verdict generation
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/verdicts/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ debateId: params.id }),
        })
      } else {
        // Advance to next round
        const now = new Date()
        const newDeadline = new Date(now.getTime() + debate.roundDuration)

        updatedDebate = await prisma.debate.update({
          where: { id: params.id },
          data: {
            currentRound: debate.currentRound + 1,
            roundDeadline: newDeadline,
          },
        })
      }
    } else {
      // Notify opponent it's their turn
      const opponentId =
        session.user.id === debate.challengerId
          ? debate.opponentId
          : debate.challengerId

      if (opponentId) {
        await prisma.notification.create({
          data: {
            userId: opponentId,
            type: 'DEBATE_TURN',
            title: 'Your Turn to Argue',
            message: `It's your turn in "${debate.topic}"`,
            debateId: debate.id,
          },
        })
      }
    }

    return NextResponse.json({
      statement,
      debate: updatedDebate,
    })
  } catch (error) {
    console.error('Failed to submit argument:', error)
    return NextResponse.json(
      { error: 'Failed to submit argument' },
      { status: 500 }
    )
  }
}
```

---

## CURSOR.AI PROMPTS

### PROMPT 1: Create Debate Modal

```
Create a modal for creating new debates:

File: components/debate/CreateDebateModal.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'

interface CreateDebateModalProps {
  isOpen: boolean
  onClose: () => void
}

const CATEGORIES = [
  { id: 'SPORTS', label: 'Sports', icon: '🏈' },
  { id: 'TECH', label: 'Tech', icon: '💻' },
  { id: 'POLITICS', label: 'Politics', icon: '🏛️' },
  { id: 'ENTERTAINMENT', label: 'Entertainment', icon: '🎬' },
  { id: 'SCIENCE', label: 'Science', icon: '🔬' },
  { id: 'OTHER', label: 'Other', icon: '💭' },
]

export function CreateDebateModal({ isOpen, onClose }: CreateDebateModalProps) {
  const router = useRouter()
  const { showToast } = useToast()

  const [topic, setTopic] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>('')
  const [position, setPosition] = useState<'FOR' | 'AGAINST'>('FOR')
  const [speedMode, setSpeedMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (!topic.trim()) {
      showToast({
        type: 'error',
        title: 'Missing Topic',
        description: 'Please enter a debate topic',
      })
      return
    }

    if (!category) {
      showToast({
        type: 'error',
        title: 'Missing Category',
        description: 'Please select a category',
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/debates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          description,
          category,
          position,
          speedMode,
        }),
      })

      if (!response.ok) throw new Error('Failed to create debate')

      const debate = await response.json()

      showToast({
        type: 'success',
        title: 'Debate Created!',
        description: 'Waiting for an opponent to accept',
      })

      onClose()
      router.push(`/debate/${debate.id}`)
      router.refresh()
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Failed to Create',
        description: 'Please try again',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Debate"
      size="lg"
    >
      <div className="space-y-6">
        {/* Topic */}
        <Input
          label="Debate Topic"
          placeholder="e.g., Is AI Art Real Art?"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          maxLength={100}
        />

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Description (Optional)
          </label>
          <textarea
            className="w-full bg-bg-secondary border border-bg-tertiary rounded-lg px-4 py-3 text-white resize-none focus:border-electric-blue focus:outline-none transition-colors"
            placeholder="Add context or specific points to address..."
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={300}
          />
          <p className="text-xs text-text-muted mt-1">
            {description.length}/300 characters
          </p>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-3">
            Category
          </label>
          <div className="grid grid-cols-3 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  category === cat.id
                    ? 'border-electric-blue bg-electric-blue/10'
                    : 'border-bg-tertiary hover:border-text-secondary'
                }`}
              >
                <div className="text-2xl mb-1">{cat.icon}</div>
                <div className={`text-sm font-semibold ${
                  category === cat.id ? 'text-electric-blue' : 'text-white'
                }`}>
                  {cat.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Position */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-3">
            Your Position
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPosition('FOR')}
              className={`p-4 rounded-lg border-2 transition-all ${
                position === 'FOR'
                  ? 'border-cyber-green bg-cyber-green/10 text-cyber-green'
                  : 'border-bg-tertiary text-white hover:border-text-secondary'
              }`}
            >
              <div className="font-bold text-lg mb-1">FOR</div>
              <div className="text-xs opacity-70">Arguing in favor</div>
            </button>
            
            <button
              onClick={() => setPosition('AGAINST')}
              className={`p-4 rounded-lg border-2 transition-all ${
                position === 'AGAINST'
                  ? 'border-neon-orange bg-neon-orange/10 text-neon-orange'
                  : 'border-bg-tertiary text-white hover:border-text-secondary'
              }`}
            >
              <div className="font-bold text-lg mb-1">AGAINST</div>
              <div className="text-xs opacity-70">Arguing against</div>
            </button>
          </div>
        </div>

        {/* Speed Mode */}
        <div className="flex items-start gap-3 p-4 bg-bg-tertiary rounded-lg">
          <input
            type="checkbox"
            id="speedMode"
            checked={speedMode}
            onChange={(e) => setSpeedMode(e.target.checked)}
            className="w-5 h-5 mt-0.5 rounded border-2 border-bg-tertiary bg-bg-secondary checked:bg-gradient-to-r checked:from-electric-blue checked:to-neon-orange checked:border-electric-blue cursor-pointer"
          />
          <div>
            <label htmlFor="speedMode" className="font-semibold text-white cursor-pointer flex items-center gap-2">
              ⚡ Speed Mode
              <Badge variant="warning" size="sm">3 rounds, 1h each</Badge>
            </label>
            <p className="text-sm text-text-secondary mt-1">
              Faster debates with 3 rounds and 1-hour deadlines (vs. standard 5 rounds, 24h each)
            </p>
          </div>
        </div>
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          isLoading={isLoading}
        >
          Create Debate
        </Button>
      </ModalFooter>
    </Modal>
  )
}
```

---

### PROMPT 2: Debate View Page

```
Create the individual debate view page:

File: app/(dashboard)/debate/[id]/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { LoadingOverlay } from '@/components/ui/Loading'
import { SubmitArgumentForm } from '@/components/debate/SubmitArgumentForm'
import { VerdictDisplay } from '@/components/debate/VerdictDisplay'

export default function DebatePage() {
  const params = useParams()
  const [debate, setDebate] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDebate()
  }, [params.id])

  const fetchDebate = async () => {
    try {
      const response = await fetch(`/api/debates/${params.id}`)
      const data = await response.json()
      setDebate(data)
    } catch (error) {
      console.error('Failed to fetch debate:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) return <LoadingOverlay message="Loading debate..." />
  if (!debate) return <div>Debate not found</div>

  return (
    <div className="min-h-screen bg-black pt-20 pb-12 px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant={debate.category.toLowerCase()}>{debate.category}</Badge>
            {debate.speedMode && <Badge variant="warning">⚡ SPEED</Badge>}
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-4">{debate.topic}</h1>
          
          {debate.description && (
            <p className="text-text-secondary">{debate.description}</p>
          )}
        </div>

        {/* Debaters */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <Card>
            <CardBody className="text-center">
              <Avatar
                src={debate.challenger.avatarUrl}
                username={debate.challenger.username}
                size="xl"
                className="mx-auto mb-4"
              />
              <h3 className="text-xl font-bold text-white mb-1">
                {debate.challenger.username}
              </h3>
              <Badge variant="success" className="mb-4">
                {debate.challengerPosition}
              </Badge>
              <div className="text-2xl font-bold text-cyber-green">
                ⚡ {debate.challenger.eloRating} ELO
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center">
              {debate.opponent ? (
                <>
                  <Avatar
                    src={debate.opponent.avatarUrl}
                    username={debate.opponent.username}
                    size="xl"
                    className="mx-auto mb-4"
                  />
                  <h3 className="text-xl font-bold text-white mb-1">
                    {debate.opponent.username}
                  </h3>
                  <Badge variant="warning" className="mb-4">
                    {debate.opponentPosition}
                  </Badge>
                  <div className="text-2xl font-bold text-cyber-green">
                    ⚡ {debate.opponent.eloRating} ELO
                  </div>
                </>
              ) : (
                <div className="py-8">
                  <p className="text-text-secondary mb-4">Waiting for opponent...</p>
                  <Button variant="primary">Accept Challenge</Button>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Progress */}
        {debate.status === 'ACTIVE' && (
          <Card className="mb-8">
            <CardBody>
              <div className="flex justify-between mb-2">
                <span className="text-white font-semibold">
                  Round {debate.currentRound} of {debate.totalRounds}
                </span>
                <span className="text-electric-blue">
                  {/* Calculate time left */}
                  Time remaining
                </span>
              </div>
              <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-electric-blue to-neon-orange"
                  style={{ width: `${(debate.currentRound / debate.totalRounds) * 100}%` }}
                />
              </div>
            </CardBody>
          </Card>
        )}

        {/* Statements */}
        <div className="space-y-6 mb-8">
          {debate.statements.map((statement: any) => (
            <Card key={statement.id}>
              <CardBody className={`border-l-4 ${
                statement.authorId === debate.challengerId
                  ? 'border-electric-blue'
                  : 'border-neon-orange'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <Avatar
                    src={statement.author.avatarUrl}
                    username={statement.author.username}
                    size="sm"
                  />
                  <div>
                    <p className="font-bold text-white">{statement.author.username}</p>
                    <p className="text-sm text-text-muted">
                      Round {statement.round} • {new Date(statement.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <p className="text-text-primary leading-relaxed">{statement.content}</p>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Submit Form */}
        {debate.status === 'ACTIVE' && (
          <SubmitArgumentForm debateId={debate.id} onSubmit={fetchDebate} />
        )}

        {/* Verdict */}
        {debate.status === 'VERDICT_READY' && (
          <VerdictDisplay debate={debate} />
        )}

      </div>
    </div>
  )
}
```

---

### PROMPT 3: Submit Argument Form

```
Create the argument submission form:

File: components/debate/SubmitArgumentForm.tsx

'use client'

import { useState } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

interface SubmitArgumentFormProps {
  debateId: string
  onSubmit: () => void
}

export function SubmitArgumentForm({ debateId, onSubmit }: SubmitArgumentFormProps) {
  const { showToast } = useToast()
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (content.trim().length < 100) {
      showToast({
        type: 'error',
        title: 'Too Short',
        description: 'Argument must be at least 100 characters',
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/debates/${debateId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      showToast({
        type: 'success',
        title: 'Argument Submitted!',
        description: 'Your argument has been submitted',
      })

      setContent('')
      onSubmit()
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Submission Failed',
        description: error.message || 'Please try again',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-electric-blue shadow-[0_0_20px_rgba(0,217,255,0.2)]">
      <CardHeader>
        <h3 className="text-xl font-bold text-white">Your Turn to Argue</h3>
      </CardHeader>
      <CardBody>
        <textarea
          className="w-full h-32 bg-bg-secondary border border-bg-tertiary rounded-lg px-4 py-3 text-white resize-none focus:border-electric-blue focus:outline-none transition-colors mb-4"
          placeholder="Write your argument..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={500}
        />
        
        <div className="flex justify-between items-center">
          <p className={`text-sm ${
            content.length < 100
              ? 'text-neon-orange'
              : content.length >= 500
              ? 'text-cyber-green'
              : 'text-text-muted'
          }`}>
            {content.length}/500 characters (min 100)
          </p>
          
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={content.length < 100}
          >
            Submit Argument →
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}
```

---

## IMPLEMENTATION ORDER

1. Create API routes (debates, accept, submit)
2. Run Prompt 1 (Create Debate Modal)
3. Run Prompt 2 (Debate View Page)
4. Run Prompt 3 (Submit Argument Form)
5. Connect FAB button to open create modal
6. Test full debate flow

PART 6 COMPLETE!
